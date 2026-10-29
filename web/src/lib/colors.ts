import type { Theme } from '@/hooks/use-theme'

// [from MW, colour, legend label]; same thresholds in both themes, tuned per basemap.
const STEPS: Record<Theme, [number, string, string][]> = {
  light: [
    [0, '#e3e3e3', '0 MW (full)'],
    [1, '#c7e9c0', '1 to 199 MW'],
    [200, '#74c476', '200 to 499 MW'],
    [500, '#238b45', '500 MW or more'],
  ],
  dark: [
    [0, '#3a3a40', '0 MW (full)'],
    [1, '#2f6b45', '1 to 199 MW'],
    [200, '#3fa766', '200 to 499 MW'],
    [500, '#7ddc9b', '500 MW or more'],
  ],
}

export const NO_RESULTS: Record<Theme, string> = { light: '#ffffff', dark: '#141417' }

export const MAP_THEME: Record<Theme, { style: string; mask: string; maskOpacity: number; line: string; label: string; halo: string; selected: string }> = {
  light: { style: 'mapbox://styles/mapbox/light-v11', mask: '#9a9aa0', maskOpacity: 0.35, line: '#444', label: '#222', halo: '#fff', selected: '#111' },
  dark: { style: 'mapbox://styles/mapbox/dark-v11', mask: '#000000', maskOpacity: 0.45, line: '#8a8a92', label: '#eee', halo: '#111', selected: '#fff' },
}

export const steps = (theme: Theme) => STEPS[theme]

export function fillColour(theme: Theme, field: 'wind_mw' | 'solar_mw') {
  const s = STEPS[theme]
  return [
    'case', ['==', ['get', field], null], NO_RESULTS[theme],
    ['step', ['get', field], s[0][1], ...s.slice(1).flatMap(([v, c]) => [v, c])],
  ]
}
