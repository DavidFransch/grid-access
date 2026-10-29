"""Mask for the map (the world minus South Africa) and supply area label points,
both from the GCCA 2025 supply areas.

Lesotho is not in any Eskom supply area, so it stays inside the mask (dimmed).
"""

from pathlib import Path

import geopandas as gpd
from shapely.geometry import box

ROOT = Path(__file__).resolve().parents[1]
AREAS_PATH = ROOT / "data/raw/gcca/gcca-2025/gis/SUPPLY_AREA_GCCA2025.shp"
OUT_PATH = ROOT / "data/processed/mask_2025.geojson"
LABELS_PATH = ROOT / "data/processed/supply_area_labels_2025.geojson"


def main():
    areas = gpd.read_file(AREAS_PATH)
    assert len(areas) == 10, f"Expected 10 supply areas, got {len(areas)}"
    country = areas.to_crs(epsg=4326).union_all().simplify(0.005)
    # Mapbox clips at about +-85 degrees latitude (Web Mercator).
    mask = box(-180, -85, 180, 85).difference(country)
    gpd.GeoDataFrame(geometry=[mask], crs=4326).to_file(OUT_PATH, driver="GeoJSON")
    print(f"Country bounds (lon/lat): {[round(b, 2) for b in country.bounds]}")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)} ({OUT_PATH.stat().st_size // 1024} KB)")

    # Supply area names for the zoomed-out view: one point inside each area's largest part.
    areas = areas.to_crs(epsg=4326)
    points = areas.geometry.map(
        lambda g: max(getattr(g, "geoms", [g]), key=lambda p: p.area).representative_point()
    )
    gpd.GeoDataFrame({"name": areas["SupplyArea"]}, geometry=points, crs=4326).to_file(LABELS_PATH, driver="GeoJSON")
    print(f"Wrote {LABELS_PATH.relative_to(ROOT)} ({len(areas)} supply areas)")


if __name__ == "__main__":
    main()
