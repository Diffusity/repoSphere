import { GitFork, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import type { Repository } from '@/types'

export function RepoCard({ repo }: { repo: Repository }) {
  return (
    <Card className="border-rs-border bg-rs-surface transition-colors hover:border-rs-link/40">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            <Link
              to={`/${repo.ownerUsername}/${repo.name}`}
              className="text-rs-link hover:underline"
            >
              {repo.ownerUsername}/{repo.name}
            </Link>
          </CardTitle>
          <Badge variant={repo.visibility === 'public' ? 'secondary' : 'outline'} className="shrink-0 text-[10px]">
            {repo.visibility === 'public' ? 'Public' : 'Private'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {repo.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-rs-link" />
          {repo.language}
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
