import { useUser } from '@clerk/clerk-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RepoCard } from '@/components/common/RepoCard'
import { useRepositories } from '@/hooks/useRepositories'
import { mockRepositories } from '@/lib/mockData'

export function ProfilePage() {
  const { username = '' } = useParams()
  const { user } = useUser()
  const { repositories } = useRepositories(username)

  const profileUser = mockRepositories.find((r) => r.owner === username)
  const displayName = profileUser?.owner ?? username
  const isYou = user?.username === username || user?.primaryEmailAddress?.emailAddress.split('@')[0] === username

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start gap-6">
        <Avatar className="size-24 border border-rs-border">
          <AvatarImage src={isYou ? user?.imageUrl ?? undefined : undefined} />
          <AvatarFallback className="text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">@{username}</p>
          <div className="mt-3 flex gap-2">
            <Badge variant="secondary">{repositories.length} repositories</Badge>
            {isYou ? <Badge>It’s you</Badge> : null}
          </div>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Public profile and repositories (mock data until the repo API ships).
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Repositories</h2>
        {repositories.length === 0 ? (
          <Card className="border-dashed border-rs-border bg-rs-surface/50">
            <CardHeader>
              <CardTitle className="text-base">No repositories</CardTitle>
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
        <p className="text-sm text-muted-foreground">
          <Link to="/settings" className="text-rs-link hover:underline">
            Manage account
          </Link>
        </p>
      ) : null}
    </div>
  )
}
