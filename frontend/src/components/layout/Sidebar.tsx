import {
  Compass,
  FolderGit2,
  LayoutDashboard,
  Menu,
  Settings,
} from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/repositories', label: 'Repositories', icon: FolderGit2 },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 p-3">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-rs-elevated text-foreground'
                : 'text-muted-foreground hover:bg-rs-elevated/70 hover:text-foreground'
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const location = useLocation()

  return (
    <>
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-rs-border bg-rs-surface/80 md:flex">
        <div className="flex h-14 items-center border-b border-rs-border px-4">
          <Link to="/dashboard" className="font-semibold tracking-tight text-foreground">
            RepoSphere
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <NavItems />
        </ScrollArea>
      </aside>

      <div className="fixed left-3 top-3 z-40 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] border-rs-border bg-rs-surface p-0">
            <div className="flex h-14 items-center border-b border-rs-border px-4">
              <Link to="/dashboard" className="font-semibold">
                RepoSphere
              </Link>
            </div>
            <NavItems key={location.pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
