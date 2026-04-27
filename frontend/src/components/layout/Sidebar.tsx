import {
  Compass,
  FolderGit2,
  GitBranch,
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
              'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-rs-elevated text-foreground shadow-sm shadow-black/20'
                : 'text-muted-foreground hover:bg-rs-elevated/65 hover:text-foreground'
            )
          }
        >
          <Icon className="size-4 shrink-0 transition group-hover:text-rs-link" />
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
      <aside className="hidden h-screen w-[256px] shrink-0 flex-col border-r border-rs-border/80 bg-rs-surface/76 backdrop-blur md:flex">
        <div className="flex h-[60px] items-center border-b border-rs-border/80 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-rs-border bg-rs-bg text-rs-accent">
              <GitBranch className="size-4" />
            </span>
            <span>RepoSphere</span>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <NavItems />
        </ScrollArea>
        <div className="border-t border-rs-border/80 p-4 text-xs leading-5 text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-rs-accent" />
            Workspace online
          </span>
        </div>
      </aside>

      <div className="fixed left-3 top-3 z-40 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu" className="bg-rs-surface/95 backdrop-blur">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[270px] border-rs-border bg-rs-surface p-0">
            <div className="flex h-14 items-center border-b border-rs-border px-4">
              <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                <span className="inline-flex size-8 items-center justify-center rounded-md border border-rs-border bg-rs-bg text-rs-accent">
                  <GitBranch className="size-4" />
                </span>
                <span>RepoSphere</span>
              </Link>
            </div>
            <NavItems key={location.pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
