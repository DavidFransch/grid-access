"""Stage 2: binding limit per Western Cape zone, plus wind curtailment allocations.

Reads the zones from load_zones.py, the GCCA 2025 results spreadsheet and the
hand-entered October 2025 curtailment table; writes one GeoJSON for the map.
"""

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ZONES_PATH = ROOT / "data/processed/western_cape_zones.geojson"
RESULTS_PATH = ROOT / "data/raw/gcca/gcca-2025/gcca-2025_results_2023-09.xlsx"
CURTAILMENT_PATH = ROOT / "data/manual/curtailment_2025-10.csv"
OUT_PATH = ROOT / "data/processed/western_cape_capacity.geojson"

# Widest to narrowest: tied levels are always listed in this order.
LIMITS = {
    "Supply_Area_Limit": "supply area",
    "Local_Area_Limit": "local area",
    "Substation_Area_Limit": "substation area",
    "Substation_Limit": "substation",
}
NUMBER_WORDS = {1: "one", 2: "two", 3: "three", 4: "four"}

SOURCES = {
    "base": "Eskom GCCA 2025 results spreadsheet (published Sep 2023)",
    "curtailment": (
        "NTCSA, Curtailment-Adjusted Connection Capacity for Wind Generators in the "
        "Eastern Cape and Western Cape, 31 Oct 2025, Table 4 and notes (pp. 7-8)"
    ),
}
CURTAILMENT_VALID = "1 Apr 2025 to 31 Mar 2028"
NOT_ALLOCATED = "Not in the October 2025 curtailment allocation."


def transformer_groups(results):
    """One row per transformer group, with its binding limit and the level(s) that set it."""
    rows = results[results["Supply_Area"] == "Western Cape"].copy()
    limits = rows[list(LIMITS)]
    assert not limits.isna().any().any(), "Western Cape rows have missing limits; decide how to treat them"
    rows["binding_mw"] = limits.min(axis=1)
    # Report every level tied at the minimum, not just the first one.
    rows["limited_by"] = limits.apply(
        lambda r: [LIMITS[c] for c in LIMITS if r[c] == r.min()], axis=1
    )
    rows["name"] = rows["Substation Name"].str.upper().str.strip()
    return rows


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


def zone_summary(groups):
    """Per substation: 'up to' the highest group's binding limit, plus every group."""
    out = {}
    for name, g in groups.groupby("name"):
        best = g.loc[g["binding_mw"].idxmax()]
        out[name] = {
            "base_mw": float(best["binding_mw"]),
            "limited_by": best["limited_by"],
            "groups": [
                {
                    "kv": r["Transformation (kV/kV)"],
                    "binding_mw": float(r["binding_mw"]),
                    "limited_by": r["limited_by"],
                }
                for _, r in g.iterrows()
            ],
        }
    return out


def main():
    zones = gpd.read_file(ZONES_PATH)
    results = pd.read_excel(RESULTS_PATH)
    curtailment = pd.read_csv(CURTAILMENT_PATH, keep_default_na=False).set_index("substation")

    summary = zone_summary(transformer_groups(results))
    zones["key"] = zones["substation"].str.upper()

    missing = sorted(set(zones["key"]) - set(summary))
    unused = sorted(set(curtailment.index) - set(zones["key"]))
    print(f"{len(zones)} zones, {len(summary)} substations in results")
    print("Zones without results:", missing or "none")
    print("Curtailment rows without a zone:", unused or "none")

    records = []
    for key in zones["key"]:
        s = summary.get(key)
        c = curtailment.loc[key] if key in curtailment.index else None
        curt_mw = float(c["curtailment_mw"]) if c is not None else 0.0
        base = s["base_mw"] if s else None
        row = zones.loc[zones["key"] == key].iloc[0]
        records.append({
            "base_reason": base_reason(base, s["limited_by"], row["supplyarea"], row["localarea"]) if s else "",
            "status_note": c["status_note"] if c is not None else "",
            "solar_mw": base,
            # Curtailment capacity is additional wind hosting capacity on top of the base result.
            "wind_mw": None if base is None else base + curt_mw,
            "limited_by": json.dumps(s["limited_by"] if s else []),
            "groups": json.dumps(s["groups"] if s else []),
            "curtailment_mw": curt_mw,
            "curtailment_shared_with": c["shared_with"].title() if c is not None and c["shared_with"] else "",
            "curtailment_reason": c["reason"] if c is not None else NOT_ALLOCATED,
            "curtailment_valid": CURTAILMENT_VALID,
            "source_base": SOURCES["base"],
            "source_curtailment": SOURCES["curtailment"],
        })

    out = pd.concat([zones.drop(columns="key").reset_index(drop=True), pd.DataFrame(records)], axis=1)
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=zones.crs)
    out.to_file(OUT_PATH, driver="GeoJSON")

    print(out[["substation", "solar_mw", "wind_mw", "curtailment_mw", "limited_by"]].to_string(index=False))
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
