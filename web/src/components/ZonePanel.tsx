import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { Tech, ZoneProps } from '@/lib/types'
import { ZoneDetails } from './ZoneDetails'

interface Props {
  zone: ZoneProps | null
  tech: Tech
  onClose: () => void
}

function Subtitle({ zone }: { zone: ZoneProps }) {
  return (
    <>
      Eskom transmission substation · {zone.localarea} local area, {zone.supplyarea}
      {zone.place && <><br />Near {zone.place}{zone.place_approx ? ' (approx.)' : ''}</>}
    </>
  )
}

// Desktop: a side sheet that leaves the map usable, so you can click from zone to zone.
// Phones: a bottom drawer. Both scroll inside, so long details are never cut off.
export function ZonePanel({ zone, tech, onClose }: Props) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const open = zone !== null
  const onOpenChange = (o: boolean) => { if (!o) onClose() }

  if (desktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="right"
          className="w-[360px] gap-0 sm:max-w-[360px]"
          onInteractOutside={e => e.preventDefault()}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {zone && (
            <>
              <SheetHeader className="pb-2">
                <SheetTitle className="text-lg">{zone.substation}</SheetTitle>
                <SheetDescription><Subtitle zone={zone} /></SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {/* key: each zone starts with its sections closed */}
                <ZoneDetails key={zone.substation} zone={zone} tech={tech} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {zone && (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle>{zone.substation}</DrawerTitle>
              <DrawerDescription><Subtitle zone={zone} /></DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              <ZoneDetails key={zone.substation} zone={zone} tech={tech} />
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
