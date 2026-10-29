import type { Mask, Zones } from './types'

// South Africa's extent, from the GCCA 2025 supply areas (pipeline/country_mask.py).
export const SA_BOUNDS: [[number, number], [number, number]] = [[16.45, -34.83], [32.94, -22.13]]

export interface MapData {
  zones: Zones
  mask: Mask
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status} (run the pipeline in pipeline/ first)`)
  return res.json() as Promise<T>
}

// Started once at import, so the download runs in parallel with the basemap.
export const mapData: Promise<MapData> = Promise.all([
  getJson<Zones>('/data/capacity_2025.geojson'),
  getJson<Mask>('/data/mask_2025.geojson'),
]).then(([zones, mask]) => ({ zones, mask }))
