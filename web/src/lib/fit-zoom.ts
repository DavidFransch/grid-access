// Zoom at which `bounds` just fits a width x height box with padding (Web Mercator, 512 px tiles,
// as Mapbox GL uses). Pure maths, so it works before the map has loaded.
type Bounds = [[number, number], [number, number]]

const x = (lng: number) => (lng + 180) / 360
const y = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180)
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
}

export function fitZoom([[w, s], [e, n]]: Bounds, width: number, height: number, padding = 30): number {
  const dx = x(e) - x(w)
  const dy = y(s) - y(n)
  const scale = Math.min((width - 2 * padding) / (dx * 512), (height - 2 * padding) / (dy * 512))
  return Math.log2(Math.max(scale, 1e-6))
}
