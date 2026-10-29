# web

The Mapbox map: Vite + React + TypeScript + Tailwind + shadcn/ui (Radix), with react-map-gl.

```
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # type-check and build to dist/
```

- Data: the dev and preview servers serve `/data/<name>` from `data/processed/` (run the pipeline first). Nothing from `data/` is copied into `dist/`; Eskom and NTCSA terms forbid redistribution.
- Token: `MAPBOX_TOKEN` in the repo-root `.env` (see `.env.example`), never in code. It is built into the bundle, as Mapbox public `pk.` tokens are meant to be; restrict it to our URLs before anything goes public.
- Localhost only until NTCSA consents to publication.
- Stage 3 switches `/data/` to the API.

`src/lib/` holds the typed data and logic (`types.ts`, `summary.ts`, `colors.ts`, `fit-zoom.ts`); `src/components/` the map, top bar, legend, zone panel and About dialog; `src/components/ui/` the shadcn components.

Data files it loads: `capacity_2025.geojson`, `capacity_labels_2025.geojson` (one label point per zone) from `pipeline/binding_limit.py`; `mask_2025.geojson`, `supply_area_labels_2025.geojson` from `pipeline/country_mask.py`.

`legacy/` is the previous single-file map (`python web/legacy/serve.py`, port 8000), kept until the new app is confirmed at parity.
