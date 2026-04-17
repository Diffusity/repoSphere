import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { CommitSummary } from '@/types'
import { formatRelativeTime, truncateHash } from '@/lib/utils'

export function LatestCommitStrip({
  latest,
  username,
  repoName,
}: {
  latest: CommitSummary
  username: string
  repoName: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 px-4 py-3 text-sm sm:px-5">
      <Avatar className="size-6 shrink-0 rounded-full ring-2 ring-primary/30">
        <AvatarFallback className="rounded-full bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-primary-foreground">
          {latest.author[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <span className="font-bold text-foreground">{latest.author}</span>
        <span className="mx-2 text-primary/40">·</span>
        <span className="text-muted-foreground">{latest.message}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link
          to={`/${username}/${repoName}/commit/${latest.hash}`}
          className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          {truncateHash(latest.hash)}
        </Link>
        <span>{formatRelativeTime(latest.timestamp)}</span>
      </div>
    </div>
  )
}
