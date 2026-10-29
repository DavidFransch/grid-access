import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/hooks/use-theme'
import { NO_RESULTS, steps } from '@/lib/colors'
import { mw } from '@/lib/format'
import type { Summary } from '@/lib/summary'
import type { Tech } from '@/lib/types'
import { AboutDialog } from './AboutDialog'

export type Region = 'all' | 'Western Cape' | 'Eastern Cape'
const REGIONS: { key: Region; label: string }[] = [
  { key: 'all', label: 'South Africa' },
  { key: 'Western Cape', label: 'Western Cape' },
  { key: 'Eastern Cape', label: 'Eastern Cape' },
]

interface Props {
  tech: Tech
  onTech: (t: Tech) => void
  summary: Summary | null
  onRegion: (r: Region) => void
}

export function ControlPanel({ tech, onTech, summary, onRegion }: Props) {
  const { theme, toggle } = useTheme()

  return (
    <div className="absolute top-4 left-4 z-10 w-[300px] max-w-[calc(100%-4rem)] space-y-3 rounded-xl border bg-card/95 p-4 text-sm text-card-foreground shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Grid Access Map</h1>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      <ToggleGroup
        type="single"
        value={tech}
        onValueChange={v => v && onTech(v as Tech)}
        variant="outline"
        className="w-full"
      >
        <ToggleGroupItem value="wind" className="flex-1">Wind</ToggleGroupItem>
        <ToggleGroupItem value="solar" className="flex-1">Solar</ToggleGroupItem>
      </ToggleGroup>

      {summary ? (
        <p className="leading-relaxed">
          <strong>Open for {tech} in {summary.open} of {summary.withResults} zones.</strong> The {summary.openAreas} supply
          areas with room have {mw(summary.areaTotal)} between them.
          {tech === 'wind' && <> Plus {mw(summary.curtailmentTotal)} of wind through curtailment in the Western and Eastern Cape, until 31 Mar 2028.</>}{' '}
          <span className="text-xs text-muted-foreground">Zones in the same area share capacity, so zone figures don't add up.</span>
        </p>
      ) : (
        <p className="text-muted-foreground">Loading zones…</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map(r => (
          <Button key={r.key} variant="outline" size="xs" className="rounded-full" onClick={() => onRegion(r.key)}>
            {r.label}
          </Button>
        ))}
      </div>

      <div className="space-y-1 text-xs">
        {steps(theme).map(([, colour, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="size-3 rounded-sm border" style={{ background: colour }} />{label}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-sm border" style={{ background: NO_RESULTS[theme] }} />No results published
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Shows Eskom's planned 2025 grid. Click a zone for details. Indicative only; a budget quote from NTCSA is the binding answer.
      </p>
      <AboutDialog />
    </div>
  )
}
