import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTheme } from '@/hooks/use-theme'
import { BANDS, bandColours, hatchCss, MAP_THEME } from '@/lib/colors'
import { mw } from '@/lib/format'
import type { Summary } from '@/lib/summary'
import { TECHNOLOGIES } from '@/lib/technologies'
import type { Tech } from '@/lib/types'

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

function Marker({ swatch, label }: { swatch: React.CSSProperties; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block size-3 rounded-[3px]" style={swatch} />
      {label}
    </span>
  )
}

// Renders every option in the same grid cell and shows only the selected one, so the card is
// always as tall as the longest option and never changes size when the choice changes.
function Stack<T extends string>({ items, selected, className }: { items: { key: T; text: string }[]; selected: T; className?: string }) {
  return (
    <div className={`grid ${className ?? ''}`}>
      {items.map(i => (
        <p key={i.key} aria-hidden={i.key !== selected} className={`col-start-1 row-start-1 ${i.key === selected ? '' : 'invisible'}`}>
          {i.text}
        </p>
      ))}
    </div>
  )
}

// The stock toggle only tints the pressed item (bg-muted); fill it with the primary colour instead.
const SELECTED =
  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground ' +
  'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground'

// Segmented control on desktop, Select on phones.
function TechPicker({ tech, onTech }: { tech: Tech; onTech: (t: Tech) => void }) {
  const desktop = useMediaQuery('(min-width: 768px)')
  if (!desktop) {
    return (
      <Select value={tech} onValueChange={v => onTech(v as Tech)}>
        <SelectTrigger id="tech-picker" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {TECHNOLOGIES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  return (
    <ToggleGroup
      id="tech-picker"
      type="single"
      value={tech}
      onValueChange={v => v && onTech(v as Tech)}
      variant="outline"
      spacing={1}
      className="grid w-full grid-cols-3"
    >
      {TECHNOLOGIES.map(t => (
        <ToggleGroupItem key={t.key} value={t.key} className={`h-8 w-full text-xs transition-colors duration-150 ${SELECTED}`}>
          {t.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function headline(key: Tech, name: string, summary: Summary | null): string {
  if (!summary) return 'Loading zones…'
  // Curtailment is wind-only, so it only ever appears in the wind headline.
  if (key === 'wind') {
    return `${mw(summary.areaTotal + summary.curtailmentTotal)} open for wind, including ${mw(summary.curtailmentTotal)} through curtailment`
  }
  return `${mw(summary.areaTotal)} open for ${name}`
}

export function Legend({ tech, onTech, summary, onRegion }: Props) {
  const { theme } = useTheme()
  const colours = bandColours(theme)
  const t = MAP_THEME[theme]
  const wind = tech === 'wind'

  // bottom-10 keeps the card clear of the Mapbox logo in the bottom-left corner.
  return (
    <Card className="absolute bottom-10 left-4 z-10 w-[340px] max-w-[calc(100%-2rem)] gap-3 rounded-[12px] bg-card/85 p-4 shadow-lg backdrop-blur-md transition-all duration-200">
      <div className="space-y-2">
        <Label htmlFor="tech-picker" className="text-xs font-medium text-muted-foreground">I'm building:</Label>
        <TechPicker tech={tech} onTech={onTech} />
        <Stack className="text-xs text-muted-foreground" selected={tech} items={TECHNOLOGIES.map(o => ({ key: o.key, text: o.note }))} />
      </div>

      <Stack
        className="border-t pt-3 text-base font-semibold leading-snug"
        selected={tech}
        items={TECHNOLOGIES.map(o => ({ key: o.key, text: headline(o.key, o.headline, summary) }))}
      />

      <div>
        <p className="mb-1 text-[11px] text-muted-foreground">Capacity (MW)</p>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {colours.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
        </div>
        <div className="mt-1 grid grid-cols-5 text-[11px] text-muted-foreground">
          {BANDS.map(b => <span key={b.label} className="text-center whitespace-nowrap">{b.label}</span>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <Marker swatch={{ background: colours[0] }} label="Full (0 MW)" />
        <Marker swatch={{ border: `1px dashed ${t.noResults}` }} label="No results" />
        {/* Always laid out, only hidden, so the row keeps its height when it wraps. */}
        <span className={wind ? '' : 'invisible'} aria-hidden={!wind}>
          <Marker swatch={{ background: `${hatchCss(theme)}, ${colours[2]}` }} label="Curtailment" />
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map(r => (
          <Button key={r.key} variant="outline" size="xs" className="rounded-full" onClick={() => onRegion(r.key)}>
            {r.label}
          </Button>
        ))}
      </div>
    </Card>
  )
}
