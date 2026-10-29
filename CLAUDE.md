# Grid Access Map

A map of where new solar and wind projects in South Africa can realistically connect to the grid, nationally (widened from Western Cape first on 2026-10-29). Mapbox front end, Python data pipeline, later FastAPI + Pydantic + Postgres/PostGIS, and eventually some ML.

**The problem:** developers can't easily see where the grid can still take a new project, so they spend months and money on budget quotes and consultants to find sites that are often already full.

## How to work with David

- Build fast. Claude writes the code; David reviews and makes the product and data decisions. Don't ask him to write code.
- Put real decisions to David as short questions with a recommendation: what the map shows, which data counts, what is honest to claim, who it is for. Make routine engineering choices yourself and mention them in one line.
- Keep explanations short: one or two lines on why, so David can explain every choice to NTCSA or in an interview.
- Ship visible results early. Prefer a working map over a perfect pipeline.
- Plain language, warm but direct. No em dashes, no hype. Never invent facts about the data. If something is unknown, say so and say how to check it.
- David commits and pushes himself. Suggest a commit message at the end of a session; only commit if he asks.
- Add one line to `docs/decisions.md` for every real choice (date, decision, why).

## Stages

| Stage | What | Status |
| --- | --- | --- |
| 1 | All 159 substation zones (2025 GIS) on Mapbox, reprojected to WGS84, locked to South Africa | Done: `pipeline/load_zones.py`, `pipeline/country_mask.py`, `web/` |
| 2 | Binding limit per zone + reason + technology filter + wind curtailment (WC and EC), every number with its source | National first version: `pipeline/binding_limit.py`; place anchor waits on MDB/OSM downloads |
| 3 | Backend foundation: Postgres with PostGIS and pgvector, FastAPI + Pydantic. Pipeline loads the database; map reads from the API | Next |
| 4 | "Ask the grid": Claude API with tool use (spatial search, capacity lookup, curtailment rules). Answers highlight zones and cite sources | |
| 5 | Feasibility layers: REDZ and strategic transmission corridors first (public GIS, high value, little work), then DFFE screening-tool sensitivity themes | |
| 6 | Pre-feasibility report (paid tier): drop a pin, get grid, likely environmental route, other approvals, lender/ESG starting points, next steps and who to engage | |
| 7 | Document search over GCCA PDFs with page citations | |
| 8 | History across GCCA editions and demand from dated connections-dashboard snapshots | |
| 9 | Prediction, only if history or NTCSA data supports it | |

Roadmap rules:
- The AI never states a number, rule or requirement that didn't come from a tool or a cited source. It explains; the data decides.
- Every rule or regulation in the product has a source and a "last checked" date.
- The pre-feasibility report is screening, not advice. By law a registered EAP does the environmental assessment; the report saves the first days of desk research.
- Grid stays the edge. Build outward from it, one layer at a time.
- AI layer sits behind one model interface (provider and model in config), with routing between a small and a larger model, prompt caching, per-user daily limits and token logging.

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
- The 2025 results spreadsheet (`gcca-2025_results_2023-09.xlsx`) has one row per transformer group. Some substations have several rows (Stikland has three). A zone shows "up to" the highest row's binding limit; the popup lists every row (decided 2026-10-29).
- Curtailment allocations are hand-entered in `data/manual/curtailment_2025-10.csv` (git-ignored) from the Oct 2025 update: Western Cape Table 4 (p. 7) and notes (p. 8), which call both Nuweveld and Galenia "planned" self-build substations; Eastern Cape Table 7 and notes (p. 10): 400 MW shared by Neptune and Pembroke (relies on a planned Pembroke 400/132 kV transformer); Dedisa, Delphi, Grassridge, Poseidon 0 (internal congestion).
- Supply area limits (MW): KwaZulu-Natal 5,500, Gauteng 4,680, Limpopo 3,360, Mpumalanga 3,320, North West 1,660, Free State 1,420; Northern Cape, Eastern Cape, Western Cape, Hydra Central 0. Zones in one area share its limit, so never add zone figures up.
- 3 spreadsheet rows have blank area limits (Delphi 400/132, Grassridge 400/132, Poseidon 220/66), filled per decisions.md and shown as "inferred". One row has a blank kV.
- Local area names repeat across supply areas (two "Kimberley", two "East London" on the dashboard), so group local areas by supply area + name.
- Spot-check 2026-10-29: 15 rows on the dashboard image match the spreadsheet (dashboard rounds to whole MW).
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
python pipeline/binding_limit.py
python pipeline/country_mask.py
python web/serve.py   # map at http://localhost:8000, localhost only
```
