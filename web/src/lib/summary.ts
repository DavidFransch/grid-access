import type { Tech, Zones } from './types'

export interface Summary {
  open: number
  withResults: number
  openAreas: number
  areaTotal: number
  curtailmentTotal: number
}

export function summarise(zones: Zones, tech: Tech): Summary {
  const props = zones.features.map(f => f.properties).filter(p => p.has_results)

  // Zones in one supply area share its limit, so total the areas, never the zones.
  const areas = new Map<string, number>()
  props.forEach(p => areas.set(p.supplyarea, p.supply_area_mw ?? 0))
  const areaValues = [...areas.values()]

  // Shared curtailment allocations (Galenia/Nuweveld, Neptune/Pembroke) count once.
  const curtailment = new Map<string, number>()
  props.filter(p => p.curtailment_mw > 0).forEach(p => {
    const key = [p.substation.toUpperCase(), p.curtailment_shared_with.toUpperCase()].sort().join('|')
    curtailment.set(key, p.curtailment_mw)
  })

  const field = tech === 'wind' ? 'wind_mw' : 'solar_mw'
  return {
    open: props.filter(p => (p[field] ?? 0) > 0).length,
    withResults: props.length,
    openAreas: areaValues.filter(v => v > 0).length,
    areaTotal: areaValues.reduce((a, v) => a + v, 0),
    curtailmentTotal: [...curtailment.values()].reduce((a, v) => a + v, 0),
  }
}
