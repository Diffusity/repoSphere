import { useUser } from '@clerk/clerk-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RepoCard } from '@/components/common/RepoCard'
import { useRepositories } from '@/hooks/useRepositories'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfilePage() {
  const { username = '' } = useParams()
  const { user, isLoaded: userLoaded } = useUser()
  const { repositories, isLoading } = useRepositories(username)

  const isYou = userLoaded && (
    user?.publicMetadata?.username === username || 
    user?.primaryEmailAddress?.emailAddress.split('@')[0] === username
  )
  
  const displayName = isYou ? (user?.fullName || username) : username

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 lg:px-0">
      <div className="flex flex-wrap items-start gap-6">
        <Avatar className="size-24 border border-rs-border bg-rs-surface">
          <AvatarImage src={isYou ? user?.imageUrl ?? undefined : undefined} />
          <AvatarFallback className="text-2xl text-white bg-rs-accent">
            {username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{displayName}</h1>
          <p className="text-muted-foreground">@{username}</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="bg-rs-surface border-rs-border text-muted-foreground">
              {isLoading ? '...' : repositories.length} repositories
            </Badge>
            {isYou && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">It’s you</Badge>}
          </div>
        </div>
      </div>

      <Separator />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Repositories</h2>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
          </div>
        ) : repositories.length === 0 ? (
          <Card className="border-dashed border-rs-border bg-rs-surface/30">
            <CardHeader className="text-center py-12">
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

      {isYou && (
        <div className="pt-6 border-t border-rs-border">
          <Button variant="link" className="p-0 text-rs-link h-auto" asChild>
            <Link to="/settings">Manage account settings →</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function Separator() {
  return <div className="h-px w-full bg-rs-border" />
}

import { Button } from '@/components/ui/button'
