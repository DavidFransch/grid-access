"""Stage 1: all MTS zones from the GCCA 2025 GIS, as WGS84 GeoJSON for Mapbox."""

from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]
ZONES_PATH = ROOT / "data/raw/gcca/gcca-2025/gis/MTS_ZONES_GCCA2025.shp"
OUT_PATH = ROOT / "data/processed/zones_2025.geojson"

KEEP = ["Substation", "LocalArea", "SupplyArea", "geometry"]


def main():
    zones = gpd.read_file(ZONES_PATH)
    assert zones.crs.to_epsg() == 4148, f"Unexpected source CRS: {zones.crs}"
    # MTS_1 duplicates Substation in every row (checked 2026-10-29), so it is dropped.
    assert (zones["MTS_1"] == zones["Substation"]).all()

    assert len(zones) == 159, f"Expected 159 zones, got {len(zones)}"

    out = zones[KEEP].rename(columns=str.lower).to_crs(epsg=4326)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    out.to_file(OUT_PATH, driver="GeoJSON")

    print(f"{len(out)} zones written")
    print(out["supplyarea"].value_counts().to_string())
    print(f"Bounds (lon/lat): {out.total_bounds.round(2)}")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
