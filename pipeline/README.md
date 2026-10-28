# pipeline

Scripts that turn `data/raw/` into `data/processed/`. One script per step, run in order.

- Stage 1: `load_zones.py` reads the 2025 GCCA zones, keeps the Western Cape, converts EPSG:4148 to WGS84 (EPSG:4326), writes GeoJSON.
- Stage 2: `binding_limit.py` reads the results spreadsheet, takes the lowest of the four limits per substation, records which level it came from, adds the curtailment allocations.
