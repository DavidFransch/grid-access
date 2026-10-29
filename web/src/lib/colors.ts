import type { Theme } from '@/hooks/use-theme'

export type MwField = 'wind_mw' | 'solar_mw'

// Sequential single-hue teal-green. Dark: more capacity = brighter. Light: more capacity = darker.
// Of the six brief colours per theme, the one closest to the 0 MW grey is dropped so neighbouring
// bands stay distinct (dark #1f5c50, light #d3f0e2).
export const BANDS: { from: number; label: string }[] = [
  { from: 0, label: '0' },
  { from: 1, label: '1–249' },
  { from: 250, label: '250–499' },
  { from: 500, label: '500–999' },
  { from: 1000, label: '1,000+' },
]

const BAND_COLOURS: Record<Theme, string[]> = {
  dark: ['#3a3f47', '#23866f', '#36b08c', '#6fd8ad', '#c2f7dc'],
  light: ['#d9dce1', '#93d6bb', '#4fb592', '#1f8a6a', '#0b5a45'],
}

export const bandColours = (theme: Theme) => BAND_COLOURS[theme]

export interface MapTheme {
  style: string
  mask: string
  maskOpacity: number
  outline: string
  noResults: string
  accent: string
  hatch: string
  // Label text and halo on ordinary fills, and on the strongest fills (>= 500 MW).
  label: [string, string]
  labelStrong: [string, string]
  areaLabel: [string, string]
}

export const MAP_THEME: Record<Theme, MapTheme> = {
  dark: {
    style: 'mapbox://styles/mapbox/dark-v11',
    mask: '#000000', maskOpacity: 0.45,
    outline: 'rgba(255,255,255,0.18)', noResults: 'rgba(255,255,255,0.45)',
    accent: '#7cb8ff', hatch: 'rgba(255,255,255,0.6)',
    label: ['#e8ecef', 'rgba(0,0,0,0.75)'], labelStrong: ['#0d1f19', 'rgba(255,255,255,0.55)'],
    areaLabel: ['#f2f4f5', 'rgba(0,0,0,0.85)'],
  },
  light: {
    style: 'mapbox://styles/mapbox/light-v11',
    mask: '#9a9aa0', maskOpacity: 0.35,
    outline: 'rgba(0,0,0,0.18)', noResults: 'rgba(0,0,0,0.45)',
    accent: '#2563eb', hatch: 'rgba(0,0,0,0.45)',
    label: ['#1d2125', 'rgba(255,255,255,0.85)'], labelStrong: ['#ffffff', 'rgba(0,0,0,0.55)'],
    areaLabel: ['#111417', 'rgba(255,255,255,0.9)'],
  },
}

// Fill by band; zones without results are transparent (they get a dashed outline instead).
export function fillColour(theme: Theme, field: MwField) {
  const c = BAND_COLOURS[theme]
  return [
    'case', ['==', ['get', field], null], 'rgba(0,0,0,0)',
    ['step', ['get', field], c[0], ...BANDS.slice(1).flatMap((b, i) => [b.from, c[i + 1]])],
  ]
}

// Label colours that stay readable on every fill.
export function labelPaint(theme: Theme, field: MwField) {
  const t = MAP_THEME[theme]
  const pick = (i: 0 | 1) => ['step', ['coalesce', ['get', field], 0], t.label[i], 500, t.labelStrong[i]]
  return { 'text-color': pick(0), 'text-halo-color': pick(1), 'text-halo-width': 1.2 }
}

// Fine diagonal hatch for curtailment capacity, drawn on a canvas and added as a map image.
export const HATCH_ID = (theme: Theme) => `hatch-${theme}`

export function hatchImage(theme: Theme): ImageData {
  const size = 8
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = MAP_THEME[theme].hatch
  ctx.lineWidth = 1
  ctx.beginPath()
  // Diagonal plus the two corner pieces, so the pattern tiles seamlessly.
  ctx.moveTo(0, size); ctx.lineTo(size, 0)
  ctx.moveTo(-1, 1); ctx.lineTo(1, -1)
  ctx.moveTo(size - 1, size + 1); ctx.lineTo(size + 1, size - 1)
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
}

// The same hatch in CSS, for the legend swatch.
export const hatchCss = (theme: Theme) =>
  `repeating-linear-gradient(135deg, ${MAP_THEME[theme].hatch} 0 1px, transparent 1px 5px)`
