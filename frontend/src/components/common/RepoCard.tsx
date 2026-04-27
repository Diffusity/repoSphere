import { GitFork, LockKeyhole, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import type { Repository } from '@/types'

export function RepoCard({ repo }: { repo: Repository }) {
  const isPublic = repo.visibility === 'public'

  return (
    <Card className="interactive-panel overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold">
              <Link to={`/${repo.ownerUsername}/${repo.name}`} className="text-rs-link hover:underline">
                {repo.ownerUsername}/{repo.name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2 min-h-10 leading-5">
              {repo.description || 'No description provided.'}
            </CardDescription>
          </div>
          <Badge variant={isPublic ? 'secondary' : 'outline'} className="shrink-0 gap-1 text-[10px] capitalize">
            {!isPublic ? <LockKeyhole className="size-3" /> : null}
            {repo.visibility}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rs-border/70 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rs-warm" />
          {repo.language || 'Plain Text'}
        </span>
        <span className="flex items-center gap-1">
          <Star className="size-3.5" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="size-3.5" />
          {repo.forks}
        </span>
        <span className="ml-auto">Updated {formatRelativeTime(repo.updatedAt)}</span>
      </CardContent>
    </Card>
  )
}
