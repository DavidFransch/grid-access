import type { Level } from './types'

export const LEVELS: { key: Level; label: string }[] = [
  { key: 'supply area', label: 'Supply area' },
  { key: 'local area', label: 'Local area' },
  { key: 'substation area', label: 'Substation area' },
  { key: 'substation', label: 'Substation' },
]

export function mw(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'no data'
  return `${Math.round(v).toLocaleString('en-ZA')} MW`
}

export const NTCSA_HOME = 'https://www.ntcsa.co.za'
export const CURTAILMENT_SOURCE_PREFIX = 'NTCSA, Curtailment'
