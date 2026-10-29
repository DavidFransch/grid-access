"""Stage 2: binding limit per zone, nationally, plus wind curtailment allocations.

Reads the zones from load_zones.py, the GCCA 2025 results spreadsheet and the
hand-entered October 2025 curtailment table; writes one GeoJSON for the map.
"""

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ZONES_PATH = ROOT / "data/processed/zones_2025.geojson"
RESULTS_PATH = ROOT / "data/raw/gcca/gcca-2025/gcca-2025_results_2023-09.xlsx"
CURTAILMENT_PATH = ROOT / "data/manual/curtailment_2025-10.csv"
OUT_PATH = ROOT / "data/processed/capacity_2025.geojson"
LABELS_PATH = ROOT / "data/processed/capacity_labels_2025.geojson"

# Widest to narrowest: tied levels are always listed in this order.
LIMITS = {
    "Supply_Area_Limit": "supply area",
    "Local_Area_Limit": "local area",
    "Substation_Area_Limit": "substation area",
    "Substation_Limit": "substation",
}
NUMBER_WORDS = {1: "one", 2: "two", 3: "three", 4: "four"}

# Citations only: NTCSA's terms allow links to their home page, not deep links (ask Ronald).
SOURCE_ZONES = "Eskom, GCCA 2025 GIS zones (MTS_ZONES_GCCA2025), Oct 2023"
SOURCE_BASE = "Eskom, GCCA 2025 Results (spreadsheet), Sep 2023, {name} row(s)"
SOURCE_ROUND5 = "Eskom, Generation Connection Capacity Assessment (GCCA) 2025, Oct 2023, Table 24: Western Cape IPPs (p. 53)"
CURTAILMENT_VALID = "1 Apr 2025 to 31 Mar 2028"
CURTAILMENT_SCOPE = {"Western Cape", "Eastern Cape"}
NOT_ALLOCATED = "Not in the October 2025 curtailment allocation, so no extra wind capacity here."


def fill_blank_limits(results):
    """Fill the few blank area limits; return the filled frame and a log of what was inferred.

    Local and supply area limits have exactly one value per area, so blanks take that value.
    A blank substation area limit is taken only from a sibling row at the same voltage;
    otherwise it stays blank ("not published").
    """
    df = results.copy()
    df["inferred"] = [[] for _ in range(len(df))]
    log = []
    for col, area_cols in [("Supply_Area_Limit", ["Supply_Area"]),
                           ("Local_Area_Limit", ["Supply_Area", "Local_Area"])]:
        per_area = df.groupby(area_cols)[col].nunique()
        assert (per_area <= 1).all(), f"{col} has more than one value in an area"
        values = df.groupby(area_cols)[col].transform("first")
        for i in df.index[df[col].isna() & values.notna()]:
            df.at[i, col] = values[i]
            df.at[i, "inferred"].append(LIMITS[col])
            log.append(f"{df.at[i, 'Substation Name']} {df.at[i, 'Transformation (kV/kV)']}: "
                       f"{LIMITS[col]} = {values[i]:g} (from its area)")
    for i in df.index[df["Substation_Area_Limit"].isna()]:
        r = df.loc[i]
        sib = df[(df["Substation Name"] == r["Substation Name"]) & (df.index != i)
                 & (df["Transformation (kV/kV)"] == r["Transformation (kV/kV)"])
                 & df["Substation_Area_Limit"].notna()]
        name = f"{r['Substation Name']} {r['Transformation (kV/kV)']}"
        if len(sib):
            value = sib["Substation_Area_Limit"].iloc[0]
            df.at[i, "Substation_Area_Limit"] = value
            df.at[i, "inferred"].append("substation area")
            log.append(f"{name}: substation area = {value:g} (from same-voltage row)")
        else:
            log.append(f"{name}: substation area not published (no same-voltage row)")
    assert df["Substation_Limit"].notna().all()
    return df, log


def transformer_groups(results):
    """One row per transformer group, with its binding limit and the level(s) that set it."""
    rows, log = fill_blank_limits(results)
    limits = rows[list(LIMITS)]
    rows["binding_mw"] = limits.min(axis=1)  # skips a "not published" blank
    # Report every level tied at the minimum, not just the first one.
    rows["limited_by"] = limits.apply(
        lambda r: [LIMITS[c] for c in LIMITS if r[c] == r.min()], axis=1
    )
    rows["not_published"] = limits.apply(lambda r: [LIMITS[c] for c in LIMITS if pd.isna(r[c])], axis=1)
    rows["name"] = rows["Substation Name"].str.upper().str.strip()
    return rows, log


def base_reason(base_mw, levels, supply_area, local_area):
    """Plain-language sentence for the base GCCA result, levels widest first."""
    names = {
        "supply area": f"the {supply_area} supply area",
        "local area": f"the {local_area} local area",
        "substation area": "the substation area",
        "substation": "the substation itself",
    }
    parts = [names[l] for l in levels]
    listed = parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " and " + parts[-1]
    if base_mw > 0:
        return f"Up to {base_mw:,.0f} MW, set by {listed}."
    n = len(parts)
    if n == 1:
        return f"Blocked at one level: {listed}. It would need new capacity before a project could connect here."
    every = "Both" if n == 2 else f"All {NUMBER_WORDS[n]}"
    return (f"Blocked at {NUMBER_WORDS[n]} levels: {listed}. "
            f"{every} would need new capacity before a project could connect here.")


def levels_mw(r):
    """Each level's limit for one transformer group, widest first; None where not published."""
    return {LIMITS[c]: (None if pd.isna(r[c]) else float(r[c])) for c in LIMITS}


def largest_part_point(geom):
    """A point inside the zone's largest part, so multi-part zones get one label."""
    part = max(getattr(geom, "geoms", [geom]), key=lambda g: g.area)
    return part.representative_point()


def zone_summary(groups):
    """Per substation: 'up to' the highest group's binding limit, plus every group."""
    out = {}
    for name, g in groups.groupby("name"):
        best = g.loc[g["binding_mw"].idxmax()]
        out[name] = {
            "base_mw": float(best["binding_mw"]),
            "limited_by": best["limited_by"],
            "supply_area_mw": float(best["Supply_Area_Limit"]),
            "local_area_mw": float(best["Local_Area_Limit"]),
            "levels_mw": levels_mw(best),
            "groups": [
                {
                    "kv": r["Transformation (kV/kV)"] if pd.notna(r["Transformation (kV/kV)"]) else None,
                    "binding_mw": float(r["binding_mw"]),
                    "limited_by": r["limited_by"],
                    "inferred": r["inferred"],
                    "not_published": r["not_published"],
                    "levels_mw": levels_mw(r),
                }
                for _, r in g.iterrows()
            ],
        }
    return out


def main():
    zones = gpd.read_file(ZONES_PATH)
    results = pd.read_excel(RESULTS_PATH)
    curtailment = pd.read_csv(CURTAILMENT_PATH, keep_default_na=False).set_index("substation")

    groups, fill_log = transformer_groups(results)
    summary = zone_summary(groups)
    zones["key"] = zones["substation"].str.upper()

    print(f"{len(zones)} zones, {len(summary)} substations in results, "
          f"{len(set(zones['key']) & set(summary))} matched")
    print("Results without a zone:", sorted(set(summary) - set(zones["key"])) or "none")
    print("Zones without results:", sorted(set(zones["key"]) - set(summary)) or "none")
    print("Curtailment rows without a zone:", sorted(set(curtailment.index) - set(zones["key"])) or "none")
    print("Blank limits:")
    for line in fill_log:
        print("  " + line)

    records = []
    for _, row in zones.iterrows():
        key = row["key"]
        s = summary.get(key)
        c = curtailment.loc[key] if key in curtailment.index else None
        curt_mw = float(c["curtailment_mw"]) if c is not None else 0.0
        base = s["base_mw"] if s else None
        in_scope = row["supplyarea"] in CURTAILMENT_SCOPE

        sources = [SOURCE_ZONES]
        if s:
            sources.append(SOURCE_BASE.format(name=row["substation"]))
        if c is not None:
            sources.append(c["source"])
        if c is not None and c["status_note"]:
            sources.append(SOURCE_ROUND5)

        records.append({
            "has_results": s is not None,
            "solar_mw": base,
            # Curtailment capacity is additional wind hosting capacity on top of the base result.
            "wind_mw": None if base is None else base + curt_mw,
            "base_reason": base_reason(base, s["limited_by"], row["supplyarea"], row["localarea"]) if s else "",
            "limited_by": json.dumps(s["limited_by"] if s else []),
            "groups": json.dumps(s["groups"] if s else [], allow_nan=False),
            "supply_area_mw": s["supply_area_mw"] if s else None,
            "local_area_mw": s["local_area_mw"] if s else None,
            "levels_mw": json.dumps(s["levels_mw"] if s else {}, allow_nan=False),
            "curtailment_mw": curt_mw,
            "curtailment_shared_with": c["shared_with"].title() if c is not None else "",
            "curtailment_shared_note": c["shared_note"] if c is not None else "",
            "curtailment_reason": c["reason"] if c is not None else (NOT_ALLOCATED if in_scope else ""),
            "curtailment_valid": CURTAILMENT_VALID,
            "status_chip": c["status_chip"] if c is not None else "",
            "status_note": c["status_note"] if c is not None else "",
            "sources": json.dumps(sources),
        })

    out = pd.concat([zones.drop(columns="key").reset_index(drop=True), pd.DataFrame(records)], axis=1)
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=zones.crs)
    out.to_file(OUT_PATH, driver="GeoJSON")
    assert "NaN" not in OUT_PATH.read_text(), "NaN in output GeoJSON (invalid JSON for browsers)"

    # One label point per zone, on its largest part (no double labels on multi-part zones).
    labels = out[["substation", "supplyarea", "has_results", "solar_mw", "wind_mw", "curtailment_mw"]].copy()
    labels = gpd.GeoDataFrame(labels, geometry=out.geometry.map(largest_part_point), crs=out.crs)
    labels.to_file(LABELS_PATH, driver="GeoJSON")
    print(f"Wrote {LABELS_PATH.relative_to(ROOT)} ({len(labels)} label points)")

    has = out[out["has_results"]]
    print(f"Open for solar: {(has['solar_mw'] > 0).sum()} zones; open for wind: {(has['wind_mw'] > 0).sum()} zones")
    print(has.groupby("supplyarea")[["supply_area_mw"]].first().to_string())
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
