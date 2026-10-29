import { useEffect, useRef, useState, type RefObject } from 'react'
import Map, { Layer, NavigationControl, Source, type MapMouseEvent, type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl'
import { fillColour, MAP_THEME } from '@/lib/colors'
import { SA_BOUNDS } from '@/lib/data'
import { fitZoom } from '@/lib/fit-zoom'
import type { Mask, Tech, Zones } from '@/lib/types'
import { useTheme } from '@/hooks/use-theme'

const TOKEN = import.meta.env.MAPBOX_TOKEN as string | undefined

interface Props {
  zones: Zones | null
  mask: Mask | null
  tech: Tech
  selectedId: number | null
  onSelect: (id: number | null) => void
  mapRef: RefObject<MapRef | null>
}

export function MapView({ zones, mask, tech, selectedId, onSelect, mapRef }: Props) {
  const { theme } = useTheme()
  const t = MAP_THEME[theme]
  const hovered = useRef<number | null>(null)

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

  const setHover = (map: MapboxMap, id: number | null) => {
    if (hovered.current !== null) map.setFeatureState({ source: 'zones', id: hovered.current }, { hover: false })
    hovered.current = id
    if (id !== null) map.setFeatureState({ source: 'zones', id }, { hover: true })
    map.getCanvas().style.cursor = id === null ? '' : 'pointer'
  }

  if (!TOKEN) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center text-sm text-muted-foreground">
        Missing MAPBOX_TOKEN in the repo-root .env (see .env.example), then restart npm run dev.
      </div>
    )
  }

  return (
    <div ref={box} className="absolute inset-0">
    <Map
      ref={mapRef}
      minZoom={minZoom}
      mapboxAccessToken={TOKEN}
      mapStyle={t.style}
      // Flat map: Mapbox's default globe projection doesn't enforce bounds.
      projection="mercator"
      initialViewState={{ bounds: SA_BOUNDS, fitBoundsOptions: { padding: 30 } }}
      style={{ position: 'absolute', inset: 0 }}
      interactiveLayerIds={['zones-fill']}
      // Keep the centre over South Africa. (maxBounds would clip the whole-country view on
      // wide or tall screens, because it keeps the entire viewport inside the box.)
      onMove={e => {
        const { longitude: lng, latitude: lat } = e.viewState
        const cl = Math.min(Math.max(lng, SA_BOUNDS[0][0]), SA_BOUNDS[1][0])
        const ct = Math.min(Math.max(lat, SA_BOUNDS[0][1]), SA_BOUNDS[1][1])
        if (cl !== lng || ct !== lat) e.target.setCenter([cl, ct])
      }}
      onMouseMove={(e: MapMouseEvent) => setHover(e.target, (e.features?.[0]?.id as number | undefined) ?? null)}
      onMouseLeave={(e: MapMouseEvent) => setHover(e.target, null)}
      onClick={(e: MapMouseEvent) => onSelect((e.features?.[0]?.id as number | undefined) ?? null)}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {mask && (
        // Dim everything outside South Africa (outline from the GCCA 2025 supply areas).
        <Source id="mask" type="geojson" data={mask}>
          <Layer id="mask" type="fill" paint={{ 'fill-color': t.mask, 'fill-opacity': t.maskOpacity }} />
        </Source>
      )}

      {zones && (
        <Source id="zones" type="geojson" data={zones} generateId>
          <Layer
            id="zones-fill"
            type="fill"
            paint={{
              'fill-color': fillColour(theme, tech === 'wind' ? 'wind_mw' : 'solar_mw') as ExpressionSpecification,
              'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.7],
            }}
          />
          <Layer id="zones-line" type="line" paint={{ 'line-color': t.line, 'line-width': 0.6 }} />
          <Layer
            id="zones-selected"
            type="line"
            filter={['==', ['id'], selectedId ?? -1]}
            paint={{ 'line-color': t.selected, 'line-width': 2.5 }}
          />
          <Layer
            id="zones-label"
            type="symbol"
            minzoom={5.5}
            layout={{ 'text-field': ['get', 'substation'], 'text-size': 12 }}
            paint={{ 'text-color': t.label, 'text-halo-color': t.halo, 'text-halo-width': 1.2 }}
          />
        </Source>
      )}
    </Map>
    </div>
  )
}
