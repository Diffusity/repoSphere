import { usePullRequests } from '@/hooks/useRepository'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitPullRequest, GitMerge, Loader2, CircleDot, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRelativeTime } from '@/lib/utils'

interface PullRequestListProps {
  username: string
  repoName: string
}

export function PullRequestList({ username, repoName }: PullRequestListProps) {
  const { data: pullsRes, isLoading } = usePullRequests(username, repoName)
  const pulls = pullsRes?.success ? pullsRes.data : []

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <GitPullRequest className="size-5" />
          Pull Requests
        </h2>
        <Button asChild className="bg-rs-accent text-white hover:bg-rs-accent/90">
          <Link to={`/${username}/${repoName}/pulls/new`}>New Pull Request</Link>
        </Button>
      </div>

      {pulls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-rs-border bg-rs-surface py-12 text-center">
          <GitPullRequest className="mx-auto mb-4 size-12 text-muted-foreground/30" />
          <h3 className="mb-2 text-lg font-medium text-white">No Pull Requests</h3>
          <p className="text-muted-foreground">There are no pull requests for this repository yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-rs-border bg-rs-surface/90">
          <ul className="divide-y divide-rs-border/80">
            {pulls.map((pr) => (
              <li key={pr.id} className="flex items-start gap-3 p-4 hover:bg-rs-bg/35 transition-colors">
                <div className="mt-1">
                  {pr.status === 'open' && <CircleDot className="size-5 text-emerald-400" />}
                  {pr.status === 'merged' && <GitMerge className="size-5 text-purple-400" />}
                  {pr.status === 'closed' && <CheckCircle2 className="size-5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/${username}/${repoName}/pulls/${pr.number}`}
                    className="text-base font-semibold text-white hover:text-rs-link transition-colors"
                  >
                    {pr.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>#{pr.number} opened {formatRelativeTime(pr.createdAt)} by {pr.authorUsername}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-xs">{pr.baseBranch}</Badge>
                    <span>←</span>
                    <Badge variant="outline" className="font-mono text-xs">{pr.compareBranch}</Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
