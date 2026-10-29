import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

// Widest to narrowest, matching pipeline/binding_limit.py.
export type Level = 'supply area' | 'local area' | 'substation area' | 'substation'

export type Tech = 'wind' | 'solar'

export interface TransformerGroup {
  kv: string | null
  binding_mw: number
  limited_by: Level[]
  inferred: Level[]
  not_published: Level[]
}

// One feature's properties in data/processed/capacity_2025.geojson.
export interface ZoneProps {
  substation: string
  localarea: string
  supplyarea: string
  has_results: boolean
  solar_mw: number | null
  wind_mw: number | null
  base_reason: string
  limited_by: Level[]
  groups: TransformerGroup[]
  supply_area_mw: number | null
  local_area_mw: number | null
  curtailment_mw: number
  curtailment_shared_with: string
  curtailment_shared_note: string
  curtailment_reason: string
  curtailment_valid: string
  status_chip: string
  status_note: string
  sources: string[]
  place?: string
  place_approx?: boolean
}

export type ZoneFeature = Feature<Polygon | MultiPolygon, ZoneProps>
export type Zones = FeatureCollection<Polygon | MultiPolygon, ZoneProps>
export type Mask = FeatureCollection<Polygon | MultiPolygon>
