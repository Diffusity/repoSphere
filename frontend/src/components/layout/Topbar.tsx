import { Bell } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuthStore } from '@/stores/authStore'

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { data: apiUser } = useCurrentUser()
  const handle = apiUser?.user.username ?? user?.username ?? apiUser?.user.email?.split('@')[0] ?? 'user'

  const onSignOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-rs-border/80 bg-rs-bg/78 pl-14 pr-4 backdrop-blur-xl md:pl-6 md:pr-6">
      <div className="hidden flex-1 md:block" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="size-9 border border-rs-border bg-rs-elevated">
                <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.name ?? ''} />
                <AvatarFallback className="bg-rs-elevated text-sm font-semibold">
                  {user?.name?.[0] ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-rs-border bg-rs-surface shadow-xl shadow-black/30"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name ?? 'Account'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/${handle}`}>Your profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rs-danger focus:text-rs-danger" onClick={() => void onSignOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}