import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NTCSA_HOME } from '@/lib/format'

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5"><Info className="size-4" />About this data</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About this data</DialogTitle>
          <DialogDescription>What the map shows, and what it doesn't.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Each zone shows the capacity a new project could connect to, from Eskom's Generation Connection Capacity
            Assessment (GCCA) 2025. Capacity is the lowest of four limits: supply area, local area, substation area and
            substation.
          </p>
          <p>
            It shows Eskom's planned 2025 grid, which assumes planned projects are complete. Wind figures in the Western
            and Eastern Cape include NTCSA's October 2025 curtailment allocation (about 4%), valid 1 Apr 2025 to 31 Mar
            2028.
          </p>
          <p>
            Zones in the same area share capacity, so zone figures don't add up. Indicative only; a budget quote from
            NTCSA is the binding answer.
          </p>
          <p className="text-muted-foreground">
            Data: Eskom / NTCSA GCCA, available from{' '}
            <a className="underline" href={NTCSA_HOME} target="_blank" rel="noopener">ntcsa.co.za</a> under GCCA.
            Basemap © Mapbox © OpenStreetMap contributors.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
