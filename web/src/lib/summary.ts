import type { MwField } from './colors'
import type { Tech, Zones } from './types'

export const mwField = (tech: Tech): MwField => (tech === 'wind' ? 'wind_mw' : 'solar_mw')

export interface Summary {
  // Any-technology capacity: supply area limits, and how many supply areas have room.
  areaTotal: number
  openAreas: number
  // Wind-only curtailment capacity, kept out of the any-technology total.
  curtailmentTotal: number
}

export function summarise(zones: Zones): Summary {
  const props = zones.features.map(f => f.properties).filter(p => p.has_results)

  // Zones in one supply area share its limit, so total the areas, never the zones.
  const areas = new Map<string, number>()
  props.forEach(p => areas.set(p.supplyarea, p.supply_area_mw ?? 0))
  const areaTotal = [...areas.values()].reduce((a, v) => a + v, 0)
  const openAreas = [...areas.values()].filter(v => v > 0).length

  // Shared curtailment allocations (Galenia/Nuweveld, Neptune/Pembroke) count once.
  const pools = new Map<string, number>()
  props.filter(p => p.curtailment_mw > 0).forEach(p => {
    const key = [p.substation.toUpperCase(), p.curtailment_shared_with.toUpperCase()].sort().join('|')
    pools.set(key, p.curtailment_mw)
  })
  const curtailmentTotal = [...pools.values()].reduce((a, v) => a + v, 0)

  return { areaTotal, openAreas, curtailmentTotal }
}
