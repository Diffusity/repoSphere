import { useState, useMemo } from 'react'
import { usePullRequests } from '@/hooks/useRepository'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitPullRequest, GitMerge, Loader2, CircleDot, AlertCircle, Plus, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PullRequestListProps {
  username: string
  repoName: string
}

export function PullRequestList({ username, repoName }: PullRequestListProps) {
  const currentUser = useAuthStore(s => s.user)
  const [status, setStatus] = useState<'open' | 'merged' | 'closed'>('open')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: pullsRes, isLoading } = usePullRequests(username, repoName)
  const allPulls = useMemo(() => pullsRes?.success ? pullsRes.data : [], [pullsRes])
  
  const filteredPulls = useMemo(() => allPulls.filter(pr => pr.status === status), [allPulls, status])
  const openCount = allPulls.filter(pr => pr.status === 'open').length
  const mergedCount = allPulls.filter(pr => pr.status === 'merged').length
  const closedCount = allPulls.filter(pr => pr.status === 'closed').length

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg border border-rs-border bg-rs-surface/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="py-2 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', status === 'open' ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            onClick={() => { setStatus('open'); setPage(1) }}
          >
            <CircleDot className="size-4 text-green-500" />
            {openCount} Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', status === 'merged' ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            onClick={() => { setStatus('merged'); setPage(1) }}
          >
            <GitMerge className="size-4 text-purple-500" />
            {mergedCount} Merged
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', status === 'closed' ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            onClick={() => { setStatus('closed'); setPage(1) }}
          >
            <GitPullRequest className="size-4 text-red-500" />
            {closedCount} Closed
          </Button>
        </div>

        {currentUser && (
          <Button asChild className="h-9 gap-1.5 bg-green-600 text-white hover:bg-green-700">
            <Link to={`/${username}/${repoName}/pulls/new`}>
              <Plus className="size-4" />
              New Pull Request
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 border-b border-rs-border pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <History className="size-4" />
          {status} Pull Requests
        </h2>

        <div className="overflow-hidden rounded-lg border border-rs-border bg-rs-surface/90 shadow-sm">
          {filteredPulls.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <GitPullRequest className="mb-4 size-10 text-muted-foreground/20" />
              <h3 className="mb-1 text-lg font-semibold text-foreground">No {status} pull requests</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                There are currently no pull requests with this status in this repository.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-rs-border/80">
              {filteredPulls.map((pr) => (
                <li key={pr.id} className="flex p-4 hover:bg-rs-bg/35 transition-all group">
                  <div className="mr-4 mt-1 shrink-0">
                    <Avatar className="size-10 border border-rs-border shadow-sm group-hover:border-rs-accent/30 transition-colors">
                      <AvatarFallback className="bg-rs-accent/10 text-rs-accent font-semibold text-xs">
                        {pr.authorUsername[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link 
                        to={`/${username}/${repoName}/pulls/${pr.number}`}
                        className="text-base font-semibold text-foreground hover:text-rs-link transition-colors truncate"
                      >
                        {pr.title}
                      </Link>
                      <Badge variant="outline" className="font-mono text-[10px] h-4 px-1 bg-rs-bg/50 border-rs-border/50 text-muted-foreground">
                        #{pr.number}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="font-medium text-gray-300">{pr.authorUsername}</span>
                      <span className="text-[10px] opacity-40">●</span>
                      <span>opened {formatRelativeTime(pr.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rs-bg/50 border border-rs-border/50 text-[10px] font-mono tracking-tight shadow-inner">
                      <span className="text-rs-link font-bold">{pr.baseBranch}</span>
                      <span className="text-muted-foreground/30 font-normal">←</span>
                      <span className="text-purple-400 font-bold">{pr.compareBranch}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                      {pr.status === 'open' && <span className="flex items-center gap-1"><CircleDot className="size-2.5 text-green-500" /> Open</span>}
                      {pr.status === 'merged' && <span className="flex items-center gap-1"><GitMerge className="size-2.5 text-purple-500" /> Merged</span>}
                      {pr.status === 'closed' && <span className="flex items-center gap-1"><GitPullRequest className="size-2.5 text-red-500" /> Closed</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {filteredPulls.length > limit && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
