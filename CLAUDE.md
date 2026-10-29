# Grid Access Map

A map of where new solar and wind projects in South Africa can realistically connect to the grid, Western Cape first. Mapbox front end, Python data pipeline, later FastAPI + Pydantic + Postgres/PostGIS, and eventually some ML.

**The problem:** developers can't easily see where the grid can still take a new project, so they spend months and money on budget quotes and consultants to find sites that are often already full.

## How to work with David

- Use the Learning approach: write routine code yourself, and leave real design decisions to David as `TODO(human)` with context, the task, and what to weigh. Then wait.
- Teach first, then ask. Explain the idea in plain language before asking him to write anything.
- Small pieces: one idea, a few lines, run it, continue.
- Plain language, warm but direct. No em dashes, no hype. Clarify assumptions before advising.
- Never invent facts about the data. If something is unknown, say so and say how to check it.
- David commits and pushes himself. Suggest a commit message at the end of a session; only commit if he asks.
- Add one line to `docs/decisions.md` for every real choice (date, decision, why).

## Stages

| Stage | What | Status |
| --- | --- | --- |
| 1 | Western Cape substation zones (2025 GIS) on Mapbox, reprojected to WGS84 | In progress: `pipeline/load_zones.py` |
| 2 | Binding limit per zone + reason + technology filter + wind curtailment, every number with its source | Next |
| 3 | Postgres/PostGIS, FastAPI, Pydantic serving the map | |
| 4 | History across GCCA editions (PDF extraction, name matching across editions) | |
| 5 | Demand: dated snapshots of the connections dashboard per supply area | |
| 6 | Site screening: zoning, environmental, distance to lines, municipal rules | |
| 7 | Prediction, only if history or NTCSA data supports it | |

After stage 2, David emails Ronald Marais (NTCSA, GCCA lead) with a screenshot.

## Layout

```bash
pipeline/   scripts: data/raw -> data/processed, one step per script
api/        FastAPI (stage 3)
web/        Mapbox map; token in .env as MAPBOX_TOKEN, never in code
notebooks/  exploration
docs/       decisions.md
data/raw/   original Eskom/NTCSA files, by dataset and GCCA edition
data/file-manifest.csv   original name, new path, SHA-256, source for every raw file
```

## Data rules

- `data/raw/` is never edited and never committed. Eskom and NTCSA terms forbid redistribution, commercial use without consent, and crawlers or bots that collect site content. Download new files by hand.
- Outputs go to `data/processed/` (also git-ignored).
- New raw file: name it `<edition>_<document-type>_<published YYYY-MM>.<ext>`, lowercase with hyphens, put it in its dataset/edition folder, and append a row to the manifest.
- "GCCA 2025" is the modelled year. It was published October 2023. Keep edition and publication date distinct.

## Domain facts (checked against the files)

- Capacity at a site is the **lowest** of four limits: substation, substation area, local area, supply area (GCCA 2025 report). The level that sets it is the "binding" limit.
- The 2025 results spreadsheet (`gcca-2025_results_2023-09.xlsx`) has one row per transformer group. Some substations have several rows (Stikland has three). Which row represents a site is an open decision for David.
- Western Cape supply area limit is 0 MW, so every Western Cape substation is 0 MW in the base results.
- The October 2025 curtailment update adds 1,180 MW for the Western Cape, **wind only**, about 4% curtailment, valid 1 Apr 2025 to 31 Mar 2028: Nuweveld/Galenia 720 combined (Nuweveld is a planned self-build substation), Droërivier 220, Bacchus 140, Agulhas 100; Komsberg, Kappa, Aurora, Muldersvlei 0. It supersedes the Jan 2024 addendum (10%, 2,680 MW).
- 2025 GIS zones (`gcca-2025/gis/MTS_ZONES_GCCA2025.shp`): 159 polygons, 16 in the Western Cape, CRS EPSG:4148 (Hartebeesthoek94). Reproject to EPSG:4326 for Mapbox.
- Names join to the spreadsheet after uppercasing: 146 of 149 match. Spreadsheet-only: BETA, HERA, MATLA. 13 zones have no results.
- 2018 GIS (`gcca-2022/gis/`) has substation points, existing and planned lines, and REIPPPP round 1 to 4B project locations.
- Connections dashboard (last updated 18 Nov 2025): 332 projects, 31,706 MW nationally; Western Cape 43 projects, 4,315 MW. Supply-area level only. Its disclaimer says the information must not be distributed further.

## Setup

```bash
source .venv/bin/activate
pip install -r requirements.txt
python pipeline/load_zones.py
```
