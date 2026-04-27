import { Link, useParams } from 'react-router-dom'
import { ContributionHeatmap } from '@/components/common/ContributionHeatmap'
import { RepoCard } from '@/components/common/RepoCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepositories } from '@/hooks/useRepositories'
import { useUserContributions } from '@/hooks/useRepository'
import { useAuthStore } from '@/stores/authStore'

export function ProfilePage() {
  const { username = '' } = useParams()
  const user = useAuthStore((s) => s.user)
  const userLoaded = useAuthStore((s) => s.isLoaded)
  const { repositories, isLoading } = useRepositories(username)
  const { data: contributions, isLoading: isLoadingContributions } = useUserContributions(username)

  const isYou = userLoaded && (user?.username === username || user?.email.split('@')[0] === username)
  const displayName = isYou ? user?.name || username : username

  return (
    <div className="app-page max-w-5xl">
      <PageHeader
        badge={isYou ? 'Your profile' : 'Public profile'}
        title={displayName}
        description={`@${username || 'user'} on RepoSphere`}
        visual={
          <Avatar className="size-16 border border-rs-border bg-rs-elevated shadow-lg shadow-black/20">
            <AvatarImage src={isYou ? user?.imageUrl ?? undefined : undefined} />
            <AvatarFallback className="bg-rs-elevated text-xl font-semibold text-white">
              {username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        }
        meta={
          <>
            <span className="page-meta-pill">{isLoading ? 'Loading repositories' : `${repositories.length} repositories`}</span>
            {isYou ? <span className="page-meta-pill">Signed in as this account</span> : null}
          </>
        }
      />

      <ContributionHeatmap data={contributions?.data} isLoading={isLoadingContributions} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Repositories</h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <Card className="border-dashed border-rs-border bg-rs-surface/70">
            <CardHeader className="py-12 text-center">
              <CardTitle className="text-base text-muted-foreground">No repositories</CardTitle>
              <CardDescription>This user has no visible repositories yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {repositories.map((r) => (
              <RepoCard key={r.id} repo={r} />
            ))}
          </div>
        )}
      </section>

      {isYou ? (
        <div className="border-t border-rs-border pt-6">
          <Button variant="link" className="h-auto p-0 text-rs-link" asChild>
            <Link to="/settings">Manage account settings</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
