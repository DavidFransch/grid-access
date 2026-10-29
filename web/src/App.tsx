import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import { Legend, type Region } from '@/components/Legend'
import { MapView } from '@/components/MapView'
import { TopBar } from '@/components/TopBar'
import { ZonePanel } from '@/components/ZonePanel'
import { mapData, SA_BOUNDS, type MapData } from '@/lib/data'
import { summarise } from '@/lib/summary'
import type { Tech, ZoneFeature } from '@/lib/types'

function boundsOf(features: ZoneFeature[]): [[number, number], [number, number]] {
  let [w, s, e, n] = [180, 90, -180, -90]
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const [x, y] of polys.flatMap(p => p[0])) {
      w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y)
    }
  }
  return [[w, s], [e, n]]
}

export default function App() {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tech, setTech] = useState<Tech>('solar')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    mapData.then(setData).catch(e => setError(String(e.message ?? e)))
  }, [])

  // Dev only: lets browser checks reach the map and data.
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __grid: { mapRef, data, tech, selectedId, setSelectedId, setTech } })
  }, [data, tech, selectedId])

  const summary = useMemo(() => (data ? summarise(data.zones) : null), [data])
  // generateId numbers features by their position in the file, so the id is the array index.
  const zone = data && selectedId !== null ? data.zones.features[selectedId]?.properties ?? null : null

  const zoomTo = (region: Region) => {
    const map = mapRef.current
    if (!map || !data) return
    const bounds = region === 'all'
      ? SA_BOUNDS
      : boundsOf(data.zones.features.filter(f => f.properties.supplyarea === region))
    map.fitBounds(bounds, { padding: 30, duration: region === 'all' ? 0 : 800 })
  }

  return (
    <div className="fixed inset-0 bg-background">
      <MapView
        data={data}
        tech={tech}
        selectedId={selectedId}
        onSelect={setSelectedId}
        mapRef={mapRef}
      />
      <TopBar />
      <Legend tech={tech} onTech={setTech} summary={summary} onRegion={zoomTo} />
      <ZonePanel zone={zone} tech={tech} onClose={() => setSelectedId(null)} />
      {error && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md bg-destructive/90 px-3 py-2 text-sm text-white">{error}</div>
      )}
    </div>
  )
}
