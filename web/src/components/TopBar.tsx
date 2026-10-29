import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'
import { AboutDialog } from './AboutDialog'

export function TopBar() {
  const { theme, toggle } = useTheme()
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between border-b bg-background/75 px-4 backdrop-blur-md">
      <h1 className="text-base font-semibold tracking-tight">Grid Access Map</h1>
      <div className="flex items-center gap-1">
        <AboutDialog />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="transition-colors duration-200"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
    </header>
  )
}
