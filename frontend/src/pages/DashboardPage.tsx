import { useUser } from '@clerk/clerk-react'
import { GitBranchPlus, Plus, Sparkles, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRepositories } from '@/hooks/useRepositories'
import { formatRelativeTime, truncateHash } from '@/lib/utils'

const activity = [
  {
    user: 'john_doe',
    message: 'feat: add authentication',
    hash: '9a1f5c152f7d58b7',
    time: '2026-03-25T07:06:00Z',
    repo: 'john_doe/my-project',
  },
  {
    user: 'jane_dev',
    message: 'fix: diff output for empty trees',
    hash: 'b2c3d4e5f6a70891',
    time: '2026-03-24T14:22:00Z',
    repo: 'john_doe/reposphere-cli',
  },
]

export function DashboardPage() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const { data: me, isLoading: userLoading } = useCurrentUser()
  const { repositories } = useRepositories()

  const displayName = user?.fullName ?? me?.user.name ?? 'there'

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-rs-border bg-rs-surface p-6">
        {!clerkLoaded || userLoading ? (
          <Skeleton className="size-14 rounded-full" />
        ) : (
          <Avatar className="size-14 border border-rs-border">
            <AvatarImage src={user?.imageUrl ?? me?.user.imageUrl ?? undefined} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
        )}
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {displayName}</h1>
          <p className="text-sm text-muted-foreground">Here’s what’s happening across your repositories.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-rs-border bg-rs-surface">
          <CardHeader className="pb-2">
            <CardDescription>Repositories</CardDescription>
            <CardTitle className="text-2xl">{repositories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-rs-border bg-rs-surface">
          <CardHeader className="pb-2">
            <CardDescription>Commits today</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-rs-border bg-rs-surface">
          <CardHeader className="pb-2">
            <CardDescription>Contributors (mock)</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-rs-border bg-rs-surface lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Recent repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repositories.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                to={`/${r.owner}/${r.name}`}
                className="flex flex-col gap-1 rounded-md border border-transparent px-2 py-2 hover:border-rs-border hover:bg-rs-elevated/60"
              >
                <span className="font-medium text-rs-link">
                  {r.owner}/{r.name}
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="text-rs-link">{truncateHash(r.latestCommit.hash)}</span>
                  <span>{formatRelativeTime(r.latestCommit.timestamp)}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-rs-border bg-rs-surface lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Activity feed</CardTitle>
            <CardDescription>Latest commits across your network (mock)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((a, i) => (
              <div key={i}>
                <div className="flex gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{a.user[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.user}</span>{' '}
                      <span className="text-muted-foreground">pushed to</span>{' '}
                      <Link to={`/${a.repo}`} className="text-rs-link hover:underline">
                        {a.repo}
                      </Link>
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{a.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {truncateHash(a.hash)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(a.time)}
                      </span>
                    </div>
                  </div>
                </div>
                {i < activity.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-rs-border bg-rs-surface lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start gap-2" variant="secondary" asChild>
              <Link to="/repositories">
                <Plus className="size-4" />
                New repository
              </Link>
            </Button>
            <Button className="justify-start gap-2" variant="secondary" asChild>
              <Link to="/settings">
                <Terminal className="size-4" />
                CLI setup
              </Link>
            </Button>
            <Button className="justify-start gap-2" variant="secondary" asChild>
              <Link to="/explore">
                <Sparkles className="size-4" />
                Explore
              </Link>
            </Button>
            <Button className="justify-start gap-2" variant="outline" asChild>
              <Link to="/repositories">
                <GitBranchPlus className="size-4" />
                View all repos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
