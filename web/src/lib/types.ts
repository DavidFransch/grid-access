import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'

// Widest to narrowest, matching pipeline/binding_limit.py.
export type Level = 'supply area' | 'local area' | 'substation area' | 'substation'

// The "I'm building:" choice. Every technology uses the base GCCA capacity; wind also gets
// curtailment capacity in the Western and Eastern Cape (see lib/technologies.ts).
export type Tech = 'solar' | 'wind' | 'battery' | 'hybrid' | 'gas' | 'other'

export interface TransformerGroup {
  kv: string | null
  binding_mw: number
  limited_by: Level[]
  inferred: Level[]
  not_published: Level[]
  levels_mw: Record<Level, number | null>
}

// One feature's properties in data/processed/capacity_2025.geojson.
export interface ZoneProps {
  substation: string
  localarea: string
  supplyarea: string
  has_results: boolean
  // Base GCCA limit; applies to any technology (named solar_mw in the data for historical reasons).
  solar_mw: number | null
  wind_mw: number | null
  base_reason: string
  limited_by: Level[]
  groups: TransformerGroup[]
  supply_area_mw: number | null
  local_area_mw: number | null
  levels_mw: Partial<Record<Level, number | null>>
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
export type Labels = FeatureCollection<Point>
