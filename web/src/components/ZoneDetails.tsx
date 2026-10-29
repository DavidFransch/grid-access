import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { CURTAILMENT_SOURCE_PREFIX, LEVELS, mw, NTCSA_HOME } from '@/lib/format'
import { CAVEAT_IN_PANEL, technology } from '@/lib/technologies'
import type { Tech, ZoneProps } from '@/lib/types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible className="border-t pt-3">
      <CollapsibleTrigger className="group flex w-full items-center gap-1 text-left text-sm font-medium transition-colors duration-150 hover:text-foreground/80">
        <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}

type Status = 'open' | 'full' | 'none'

function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-semibold',
        status === 'open' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        // Red is reserved for 0 MW.
        status === 'full' && 'bg-red-500/15 text-red-700 dark:text-red-300',
        status === 'none' && 'bg-muted text-muted-foreground',
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {label}
    </div>
  )
}

function SourceList({ sources }: { sources: string[] }) {
  return (
    <>
      <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
        {sources.map(s => <li key={s}>{s}</li>)}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">
        Available from <a className="underline" href={NTCSA_HOME} target="_blank" rel="noopener">ntcsa.co.za</a> under GCCA.
      </p>
    </>
  )
}

const Footer = () => (
  <p className="border-t pt-3 text-xs text-muted-foreground">Indicative only. A budget quote from NTCSA is the binding answer.</p>
)

export function ZoneDetails({ zone: p, tech }: { zone: ZoneProps; tech: Tech }) {
  if (!p.has_results) {
    return (
      <div className="space-y-4 text-sm">
        <StatusBadge status="none" label="No results published" />
        <p>GCCA 2025 has a zone for this substation but publishes no capacity result for it.</p>
        <Section title={`Sources (${p.sources.length})`}><SourceList sources={p.sources} /></Section>
        <Footer />
      </div>
    )
  }

  // Curtailment only adds capacity in the Wind view, and only where NTCSA allocated some.
  const curtailed = tech === 'wind' && p.curtailment_mw > 0
  const value = (curtailed ? p.wind_mw : p.solar_mw) ?? 0
  const base = p.solar_mw ?? 0
  // "Up to" only where several transformer groups have different limits.
  const upTo = p.groups.length > 1 ? 'up to ' : ''
  const shared = curtailed && p.curtailment_shared_with

  const chips: { label: string; warn?: boolean }[] = []
  if (curtailed) chips.push({ label: 'Wind only' }, { label: '~4% curtailment' }, { label: 'Until 31 Mar 2028' })
  else if (value > 0) chips.push({ label: 'Any technology' })
  if (p.status_chip) chips.push({ label: p.status_chip, warn: true })

  // The curtailment document is only a source in the Wind view.
  const sources = tech === 'wind' ? p.sources : p.sources.filter(s => !s.startsWith(CURTAILMENT_SOURCE_PREFIX))

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <div className="space-y-2">
        <StatusBadge
          status={value > 0 ? 'open' : 'full'}
          label={value > 0 ? `Open${curtailed ? ' for wind' : ''} · ${upTo}${mw(value)}${shared ? '*' : ''}` : 'Full'}
        />
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map(c => (
              <Badge
                key={c.label}
                variant={c.warn ? 'secondary' : 'outline'}
                className={cn(c.warn && 'bg-amber-500/15 text-amber-800 dark:text-amber-300')}
              >
                {c.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {CAVEAT_IN_PANEL.includes(tech) && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">{technology(tech).note}</p>
      )}

      {(shared || (tech === 'wind' && p.curtailment_reason) || p.status_note) && (
        <div className="space-y-2">
          {shared && <p className="text-xs text-muted-foreground">*{p.curtailment_shared_note}</p>}
          {tech === 'wind' && p.curtailment_reason && <p>{p.curtailment_reason}</p>}
          {p.status_note && <p className="text-xs text-muted-foreground">{p.status_note}</p>}
        </div>
      )}

      {base > 0 && (
        <p>
          The {mw(base)} draws on shared pools: {mw(p.supply_area_mw)} for all of {p.supplyarea} and{' '}
          {mw(p.local_area_mw)} for the {p.localarea} area. Projects elsewhere in these areas use the same pools first.
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold">
          {curtailed ? 'Without curtailment' : 'Grid limits'}: {base > 0 ? `${upTo}${mw(base)}` : 'full'}
        </p>
        <div className="grid grid-cols-4 gap-1">
          {LEVELS.map(({ key, label }) => {
            const v = p.levels_mw[key]
            const limiting = p.limited_by.includes(key)
            return (
              <div
                key={key}
                title={key === 'local area' ? `${p.localarea} local area` : label}
                className={cn(
                  'rounded-md px-1 py-1.5 text-center leading-tight',
                  // Red only for 0 MW; the limiting level is marked with the neutral accent.
                  v === 0 ? 'bg-red-500/80 text-white' : 'bg-muted text-muted-foreground',
                  limiting && 'ring-2 ring-blue-600 ring-offset-1 ring-offset-background dark:ring-blue-300',
                  limiting && v !== 0 && 'bg-blue-600/15 text-foreground dark:bg-blue-300/15',
                )}
              >
                <div className="text-[10.5px]">{label}</div>
                <div className="text-xs font-semibold">{v === null || v === undefined ? 'n/p' : mw(v)}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Outlined: the level{p.limited_by.length > 1 ? 's' : ''} setting the limit. Red: 0 MW. {p.base_reason}
        </p>
      </div>

      {p.groups.length > 0 && (
        <Section title={`Transformer details (${p.groups.length})`}>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-medium">Transformation</th>
                <th className="py-1 font-medium">Limit</th>
                <th className="py-1 font-medium">Set by</th>
              </tr>
            </thead>
            <tbody>
              {p.groups.map((g, i) => (
                <tr key={i} className="border-t align-top">
                  <td className="py-1">{g.kv ? `${g.kv} kV` : 'not published'}</td>
                  <td className="py-1">{mw(g.binding_mw)}</td>
                  <td className="py-1">
                    {g.limited_by.join(', ')}
                    {g.inferred.length > 0 && <div className="text-muted-foreground">inferred: {g.inferred.join(', ')}</div>}
                    {g.not_published.length > 0 && <div className="text-muted-foreground">not published: {g.not_published.join(', ')}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {p.groups.some(g => g.inferred.length > 0) && (
            <p className="mt-2 text-xs text-muted-foreground">
              Inferred: blank in the spreadsheet, filled from the same area or a same-voltage row. n/p: not published.
            </p>
          )}
        </Section>
      )}

      <Section title={`Sources (${sources.length})`}><SourceList sources={sources} /></Section>
      <Footer />
    </div>
  )
}
