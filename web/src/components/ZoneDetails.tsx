import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { CURTAILMENT_SOURCE_PREFIX, LEVELS, mw, NTCSA_HOME } from '@/lib/format'
import type { Tech, ZoneProps } from '@/lib/types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible className="border-t pt-2">
      <CollapsibleTrigger className="group flex w-full items-center gap-1 text-left text-sm font-medium">
        <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function StatusBadge({ open, label }: { open: boolean; label: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-semibold',
        open ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
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
  <p className="pt-2 text-xs text-muted-foreground">Indicative only. A budget quote from NTCSA is the binding answer.</p>
)

export function ZoneDetails({ zone: p, tech }: { zone: ZoneProps; tech: Tech }) {
  const isWind = tech === 'wind'

  if (!p.has_results) {
    return (
      <div className="space-y-3 text-sm">
        <StatusBadge open={false} label="No results published" />
        <p>GCCA 2025 has a zone for this substation but publishes no capacity result for it.</p>
        <Section title={`Sources (${p.sources.length})`}><SourceList sources={p.sources} /></Section>
        <Footer />
      </div>
    )
  }

  const value = isWind ? p.wind_mw : p.solar_mw
  const shared = isWind && p.curtailment_mw > 0 && p.curtailment_shared_with
  const sources = isWind ? p.sources : p.sources.filter(s => !s.startsWith(CURTAILMENT_SOURCE_PREFIX))
  const chips: { label: string; warn?: boolean }[] = []
  if (isWind && p.curtailment_mw > 0) {
    chips.push({ label: 'Wind only' }, { label: '~4% curtailment' }, { label: 'Until 31 Mar 2028' })
  }
  if (p.status_chip) chips.push({ label: p.status_chip, warn: true })

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <StatusBadge
        open={(value ?? 0) > 0}
        label={(value ?? 0) > 0 ? `Open for ${tech} · ${mw(value)}${shared ? '*' : ''}` : `Full for ${tech}`}
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

      {shared && <p className="text-xs text-muted-foreground">*{p.curtailment_shared_note}</p>}
      {isWind && p.curtailment_reason && <p>{p.curtailment_reason}</p>}
      {p.status_note && <p className="text-xs text-muted-foreground">{p.status_note}</p>}
      {(p.solar_mw ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Shares capacity with other zones: the {p.supplyarea} supply area has {mw(p.supply_area_mw)} in total and
          the {p.localarea} local area {mw(p.local_area_mw)}.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold">
          {isWind ? 'Without curtailment' : 'Grid limits'}: {(p.solar_mw ?? 0) > 0 ? `up to ${mw(p.solar_mw)}` : 'full'}
        </p>
        <div className="grid grid-cols-4 gap-1">
          {LEVELS.map(({ key, label }) => (
            <div
              key={key}
              title={key === 'local area' ? `${p.localarea} local area` : label}
              className={cn(
                'rounded px-1 py-1.5 text-center text-[10.5px] leading-tight',
                p.limited_by.includes(key) ? 'bg-red-600 font-semibold text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {label}
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Red marks the level{p.limited_by.length > 1 ? 's' : ''} setting the limit. {p.base_reason}
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
              Inferred: blank in the spreadsheet, filled from the same area or a same-voltage row.
            </p>
          )}
        </Section>
      )}

      <Section title={`Sources (${sources.length})`}><SourceList sources={sources} /></Section>
      <Footer />
    </div>
  )
}
