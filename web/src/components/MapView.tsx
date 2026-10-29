import { useEffect, useRef, useState, type RefObject } from 'react'
import Map, { Layer, NavigationControl, Source, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl'
import { fillColour, HATCH_ID, hatchImage, labelPaint, MAP_THEME } from '@/lib/colors'
import { SA_BOUNDS, type MapData } from '@/lib/data'
import { fitZoom } from '@/lib/fit-zoom'
import { mw } from '@/lib/format'
import { mwField } from '@/lib/summary'
import type { Tech } from '@/lib/types'
import { useTheme, type Theme } from '@/hooks/use-theme'

const TOKEN = import.meta.env.MAPBOX_TOKEN as string | undefined
// Supply area names when zoomed out, substation names when zoomed in.
const LABEL_SWITCH_ZOOM = 5.6

interface Props {
  data: MapData | null
  tech: Tech
  selectedId: number | null
  onSelect: (id: number | null) => void
  mapRef: RefObject<MapRef | null>
}

interface Hover {
  id: number
  x: number
  y: number
}

// The hatch image is requested again after every style change (theme switch), so listen for it
// once per map. Map listeners survive style changes.
const hatchListening = new WeakSet<MapboxMap>()
function listenForHatch(map: MapboxMap) {
  if (hatchListening.has(map)) return
  hatchListening.add(map)
  map.on('styleimagemissing', e => {
    if (!e.id.startsWith('hatch-')) return
    const theme: Theme = e.id === HATCH_ID('light') ? 'light' : 'dark'
    if (!map.hasImage(e.id)) map.addImage(e.id, hatchImage(theme), { pixelRatio: 2 })
  })
}

export function MapView({ data, tech, selectedId, onSelect, mapRef }: Props) {
  const { theme } = useTheme()
  const t = MAP_THEME[theme]
  const field = mwField(tech)
  const [hover, setHover] = useState<Hover | null>(null)
  const hoveredId = useRef<number | null>(null)

  // The country never shrinks below its framed size. Computed from the container size, so it
  // applies from the first frame (not after every basemap tile loads) and on every resize.
  const box = useRef<HTMLDivElement>(null)
  const [minZoom, setMinZoom] = useState(0)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setMinZoom(fitZoom(SA_BOUNDS, el.clientWidth, el.clientHeight) - 0.25)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Attach as soon as the map exists; onLoad below covers the case where it isn't ready yet.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (map) listenForHatch(map)
  }, [data, mapRef])

  const setHovered = (map: MapboxMap, next: Hover | null) => {
    const id = next?.id ?? null
    if (hoveredId.current !== id) {
      if (hoveredId.current !== null) map.setFeatureState({ source: 'zones', id: hoveredId.current }, { hover: false })
      if (id !== null) map.setFeatureState({ source: 'zones', id }, { hover: true })
      hoveredId.current = id
    }
    map.getCanvas().style.cursor = id === null ? '' : 'pointer'
    setHover(next)
  }

  if (!TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center text-sm text-muted-foreground">
        Missing MAPBOX_TOKEN in the repo-root .env (see .env.example), then restart npm run dev.
      </div>
    )
  }

  const hovered = hover && data ? data.zones.features[hover.id]?.properties : null

  return (
    <div ref={box} className="absolute inset-0">
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        mapStyle={t.style}
        minZoom={minZoom}
        // Flat map: Mapbox's default globe projection doesn't enforce bounds.
        projection="mercator"
        initialViewState={{ bounds: SA_BOUNDS, fitBoundsOptions: { padding: 30 } }}
        style={{ position: 'absolute', inset: 0 }}
        interactiveLayerIds={['zones-fill']}
        onLoad={e => listenForHatch(e.target)}
        // Keep the centre over South Africa. (maxBounds would clip the whole-country view on
        // wide or tall screens, because it keeps the entire viewport inside the box.)
        onMove={e => {
          const { longitude: lng, latitude: lat } = e.viewState
          const cl = Math.min(Math.max(lng, SA_BOUNDS[0][0]), SA_BOUNDS[1][0])
          const ct = Math.min(Math.max(lat, SA_BOUNDS[0][1]), SA_BOUNDS[1][1])
          if (cl !== lng || ct !== lat) e.target.setCenter([cl, ct])
        }}
        onMouseMove={(e: MapMouseEvent) => {
          const id = e.features?.[0]?.id as number | undefined
          setHovered(e.target, id === undefined ? null : { id, x: e.point.x, y: e.point.y })
        }}
        onMouseLeave={(e: MapMouseEvent) => setHovered(e.target, null)}
        onClick={(e: MapMouseEvent) => onSelect((e.features?.[0]?.id as number | undefined) ?? null)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {data && (
          <>
            {/* Dim everything outside South Africa (outline from the GCCA 2025 supply areas). */}
            <Source id="mask" type="geojson" data={data.mask}>
              <Layer id="mask" type="fill" paint={{ 'fill-color': t.mask, 'fill-opacity': t.maskOpacity }} />
            </Source>

            <Source id="zones" type="geojson" data={data.zones} generateId>
              <Layer
                id="zones-fill"
                type="fill"
                paint={{
                  'fill-color': fillColour(theme, field) as ExpressionSpecification,
                  'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, 0.78],
                  'fill-opacity-transition': { duration: 150 },
                }}
              />
              {/* Curtailment capacity: fine diagonal hatch over the fill (wind view only). */}
              <Layer
                id="zones-curtailment"
                type="fill"
                filter={['>', ['get', 'curtailment_mw'], 0]}
                layout={{ visibility: tech === 'wind' ? 'visible' : 'none' }}
                paint={{ 'fill-pattern': HATCH_ID(theme) }}
              />
              <Layer
                id="zones-line"
                type="line"
                filter={['==', ['get', 'has_results'], true]}
                paint={{ 'line-color': t.outline, 'line-width': 0.6 }}
              />
              <Layer
                id="zones-no-results"
                type="line"
                filter={['==', ['get', 'has_results'], false]}
                paint={{ 'line-color': t.noResults, 'line-width': 1, 'line-dasharray': [2, 2] }}
              />
              <Layer
                id="zones-selected"
                type="line"
                filter={['==', ['id'], selectedId ?? -1]}
                paint={{ 'line-color': t.accent, 'line-width': 2.5 }}
              />
            </Source>

            {/* One label per zone, placed on its largest part. */}
            <Source id="zone-labels" type="geojson" data={data.zoneLabels}>
              <Layer
                id="zone-labels"
                type="symbol"
                minzoom={LABEL_SWITCH_ZOOM}
                layout={{ 'text-field': ['get', 'substation'], 'text-size': 12 }}
                paint={labelPaint(theme, field) as never}
              />
            </Source>
            <Source id="area-labels" type="geojson" data={data.areaLabels}>
              <Layer
                id="area-labels"
                type="symbol"
                maxzoom={LABEL_SWITCH_ZOOM}
                layout={{ 'text-field': ['get', 'name'], 'text-size': 13, 'text-transform': 'uppercase', 'text-letter-spacing': 0.08 }}
                paint={{ 'text-color': t.areaLabel[0], 'text-halo-color': t.areaLabel[1], 'text-halo-width': 1.5 }}
              />
            </Source>
          </>
        )}
      </Map>

      {hover && hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover/95 px-2.5 py-1.5 text-xs text-popover-foreground shadow-md backdrop-blur"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-medium">{hovered.substation}</div>
          <div className="text-muted-foreground">
            {!hovered.has_results ? 'No results published' : (hovered[field] ?? 0) > 0 ? mw(hovered[field]) : 'Full'}
          </div>
        </div>
      )}
    </div>
  )
}
