"""Stage 1: Western Cape MTS zones from the GCCA 2025 GIS, as WGS84 GeoJSON for Mapbox."""

from pathlib import Path

import geopandas as gpd

ROOT = Path(__file__).resolve().parents[1]
ZONES_PATH = ROOT / "data/raw/gcca/gcca-2025/gis/MTS_ZONES_GCCA2025.shp"
OUT_PATH = ROOT / "data/processed/western_cape_zones.geojson"

# "Western Cape" means Eskom's supply area, not the province border (docs/decisions.md).
SUPPLY_AREA = "Western Cape"
KEEP = ["Substation", "LocalArea", "SupplyArea", "geometry"]


def main():
    zones = gpd.read_file(ZONES_PATH)
    assert zones.crs.to_epsg() == 4148, f"Unexpected source CRS: {zones.crs}"
    # MTS_1 duplicates Substation in every row (checked 2026-10-29), so it is dropped.
    assert (zones["MTS_1"] == zones["Substation"]).all()

    wc = zones.loc[zones["SupplyArea"] == SUPPLY_AREA, KEEP]
    wc = wc.rename(columns=str.lower).to_crs(epsg=4326)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wc.to_file(OUT_PATH, driver="GeoJSON")

    print(f"{len(zones)} zones read, {len(wc)} in {SUPPLY_AREA}")
    print(f"Bounds (lon/lat): {wc.total_bounds.round(2)}")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
