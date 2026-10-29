# Grid Access Map

A map of where new generation projects in South Africa can realistically connect to the grid, starting with the Western Cape. Built from NTCSA's published Generation Connection Capacity Assessment (GCCA) and Generation Customer Connections Data Dashboard.

## Folder structure

```
data/
  raw/                      original documents, never edited, never committed
    gcca/gcca-<edition>/    one folder per GCCA edition, including its updates and GIS
    connections-dashboard/  guide and dated screenshots of the connections dashboard
    terms/                  Eskom and NTCSA website terms
  file-manifest.csv         every original file: old name, new path, SHA-256, source
```

## Naming

`<edition>_<document-type>_<published YYYY-MM>.<ext>`, lowercase with hyphens.

The GCCA edition is the year the grid is modelled for, not the year it was published (GCCA 2025 was published in October 2023), so both appear in the name.

## Raw data is not in this repository

Eskom and NTCSA terms do not allow redistribution without consent, so `data/raw/` is git-ignored. To rebuild it, download each file from the `source_page` in `data/file-manifest.csv` and check its `sha256`.

## Disclaimer

All figures come from NTCSA and Eskom publications, provided "as is". They are not advice and may be out of date. Always check the source document.

## Project layout

```
pipeline/   scripts: data/raw -> data/processed
api/        FastAPI service (stage 3)
web/        Mapbox map (Vite + React + shadcn/ui)
notebooks/  exploration
docs/       decision log
```

## Setup

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your Mapbox token

python pipeline/load_zones.py
python pipeline/binding_limit.py
python pipeline/country_mask.py

cd web && npm install && npm run dev   # http://127.0.0.1:5173
```
