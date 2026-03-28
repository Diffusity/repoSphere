import { SignOutButton, useUser } from '@clerk/clerk-react'
import { Bell, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function Topbar() {
  const { user } = useUser()
  const { data: apiUser } = useCurrentUser()
  const handle = apiUser?.user.email?.split('@')[0] ?? user?.username ?? 'user'

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-rs-border bg-rs-bg/90 pl-14 pr-4 backdrop-blur md:pl-6 md:pr-6">
      <div className="hidden flex-1 md:block" />
      <div className="relative flex flex-1 md:max-w-md">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search repositories…"
          className="h-9 bg-rs-surface pl-9"
          aria-label="Search"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="size-9 border border-rs-border">
                <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.fullName ?? ''} />
                <AvatarFallback>{user?.firstName?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-rs-border bg-rs-surface">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName ?? 'Account'}</p>
                <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
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
            <SignOutButton>
              <DropdownMenuItem className="text-rs-danger focus:text-rs-danger">Sign out</DropdownMenuItem>
            </SignOutButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
