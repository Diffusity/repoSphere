import { FolderGit2, GitBranchPlus, Plus, Sparkles, Terminal, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ContributionHeatmap } from '@/components/common/ContributionHeatmap'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRepositories } from '@/hooks/useRepositories'
import { useUserActivity, useUserContributions, useUserStats } from '@/hooks/useRepository'
import { formatRelativeTime, truncateHash } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const authLoaded = useAuthStore((s) => s.isLoaded)
  const { data: me, isLoading: userLoading } = useCurrentUser()

  const username = user?.username || me?.user.username || ''
  const { repositories, isLoading: reposLoading } = useRepositories(username)
  const { data: activityData, isLoading: activityLoading } = useUserActivity(username)
  const { data: statsData, isLoading: statsLoading } = useUserStats(username)
  const { data: contributions, isLoading: isLoadingContributions } = useUserContributions(username)

  const displayName = user?.name ?? me?.user.name ?? 'there'
  const activityList = activityData?.success ? activityData.data : []
  const stats = statsData?.success ? statsData.data : { repoCount: 0, commitsToday: 0, contributors: 0 }

  return (
    <div className="app-page">
      <section className="surface-panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 p-5">
          {!authLoaded || userLoading ? (
            <Skeleton className="size-14 rounded-full" />
          ) : (
            <Avatar className="size-14 border border-rs-border bg-rs-elevated">
              <AvatarImage src={user?.imageUrl ?? me?.user.imageUrl ?? undefined} />
              <AvatarFallback className="bg-rs-elevated text-lg font-semibold">{displayName[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h1 className="page-title">Welcome back, {displayName}</h1>
            <p className="page-subtitle">Here is what is happening across your repositories.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Repositories"
          value={reposLoading ? <Skeleton className="h-8 w-12" /> : stats.repoCount}
          icon={FolderGit2}
        />
        <StatCard
          label="Commits today"
          value={statsLoading ? <Skeleton className="h-8 w-12" /> : stats.commitsToday}
          icon={GitBranchPlus}
        />
        <StatCard
          label="Contributors"
          value={statsLoading ? <Skeleton className="h-8 w-12" /> : stats.contributors}
          icon={Users}
        />
      </div>

      <Card className="surface-panel overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Contribution Activity</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 pt-4">
          <ContributionHeatmap data={contributions?.data} isLoading={isLoadingContributions} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-base">Recent Repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reposLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : repositories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repositories yet.</p>
            ) : (
              repositories.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to={`/${username}/${r.name}`}
                  className="flex flex-col gap-1 rounded-md border border-transparent px-3 py-2 transition hover:border-rs-border hover:bg-rs-elevated/60"
                >
                  <span className="truncate font-medium text-rs-link">
                    {username}/{r.name}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span className="text-rs-link">{r.latestCommit ? truncateHash(r.latestCommit.hash) : 'Initial'}</span>
                    <span>{r.latestCommit ? formatRelativeTime(r.latestCommit.timestamp) : ''}</span>
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-base">Activity Feed</CardTitle>
            <CardDescription>Latest commits from your repositories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : activityList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              activityList.map((a, i) => (
                <div key={`${a.hash}-${i}`}>
                  <div className="flex gap-3">
                    <Avatar className="size-9 bg-rs-elevated">
                      <AvatarFallback className="bg-rs-elevated">{a.user[0]?.toUpperCase()}</AvatarFallback>
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
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(a.time)}</span>
                      </div>
                    </div>
                  </div>
                  {i < activityList.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
}) {
  return (
    <Card className="surface-panel">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-rs-link" />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardContent>
    </Card>
  )
}
