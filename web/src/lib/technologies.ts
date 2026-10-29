import type { Tech } from './types'

// "I'm building:" options. Every technology shows the base GCCA capacity; only wind adds
// curtailment. Notes checked against the GCCA 2025 report, Jan 2024 addendum and Oct 2025
// curtailment update (2026-10-29): none has technology-specific capacity rules, storage is not
// assessed separately, and curtailment is allocated to "wind generators".
export const TECHNOLOGIES: { key: Tech; label: string; headline: string; note: string }[] = [
  {
    key: 'solar', label: 'Solar PV', headline: 'solar PV',
    note: 'Solar PV uses the base grid capacity. GCCA 2025 has no solar PV-specific rules.',
  },
  {
    key: 'wind', label: 'Wind', headline: 'wind',
    note: 'Wind uses the base grid capacity, plus extra room in the Western and Eastern Cape for projects that accept about 4% curtailment, until 31 Mar 2028.',
  },
  {
    key: 'battery', label: 'Battery storage', headline: 'battery storage',
    note: "Grid capacity for storage isn't assessed separately in GCCA 2025. Shown as base capacity. Confirm with NTCSA.",
  },
  {
    key: 'hybrid', label: 'Hybrid', headline: 'hybrid projects',
    note: "Hybrid uses the base grid capacity. GCCA 2025 has no hybrid-specific rules. The curtailment allocation is for wind generators; whether a hybrid's wind part can use it isn't stated.",
  },
  {
    key: 'gas', label: 'Gas', headline: 'gas',
    note: 'Gas uses the base grid capacity. GCCA 2025 has no gas-specific rules.',
  },
  {
    key: 'other', label: 'Other', headline: 'other technologies',
    note: 'Other technologies use the base grid capacity. GCCA 2025 has no technology-specific rules.',
  },
]

export const technology = (key: Tech) => TECHNOLOGIES.find(t => t.key === key)!

// Technologies whose panel should repeat the caveat, because the answer isn't settled.
export const CAVEAT_IN_PANEL: Tech[] = ['battery', 'hybrid']
