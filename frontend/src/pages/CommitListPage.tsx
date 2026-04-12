import { ChevronDown, ChevronRight, History, GitCommit, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CommitHash } from '@/components/common/CommitHash'
import { DiffViewer } from '@/components/common/DiffViewer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCommitDate, formatRelativeTime } from '@/lib/utils'
import { useRepository, useCommits, useCommitDiff } from '@/hooks/useRepository'
import { RS_BRANCH_DEFAULT } from '@/lib/constants'

export function CommitListPage() {
  const { username = '', repoName = '', branch: branchFromRoute } = useParams()
  const branch = branchFromRoute ?? RS_BRANCH_DEFAULT
  
  const { data: repoRes, isLoading: repoLoading } = useRepository(username, repoName)
  const { data: commitsRes, isLoading: commitsLoading } = useCommits(username, repoName, branch)
  
  const repo = repoRes?.success ? repoRes.data : null
  const commits = commitsRes?.success ? commitsRes.data : []
  
  const [expandedHash, setExpandedHash] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const groups = new Map<string, typeof commits>()
    for (const c of commits) {
      const key = formatCommitDate(c.timestamp)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(c)
    }
    return Array.from(groups.entries())
  }, [commits])

  if (repoLoading || (commitsLoading && commits.length === 0)) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        Unknown repository
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 lg:px-0">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">
          <Link to={`/${username}/${repoName}`} className="text-rs-link hover:underline">
            {username}/{repoName}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <History className="size-6 text-muted-foreground" />
          Commits on {branch}
        </h1>
      </div>

      <div className="space-y-10">
        {byDate.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-rs-border rounded-lg bg-rs-surface">
            <GitCommit className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No commits found for this branch.</p>
          </div>
        ) : (
          byDate.map(([label, list]) => (
            <section key={label}>
              <h2 className="mb-4 border-b border-rs-border pb-2 text-sm font-semibold text-muted-foreground">
                Commits on {label}
              </h2>
              <ul className="divide-y divide-rs-border rounded-lg border border-rs-border bg-rs-surface">
                {list.map((c) => (
                  <CommitListItem 
                    key={c.hash} 
                    commit={c} 
                    username={username} 
                    repoName={repoName}
                    isExpanded={expandedHash === c.hash}
                    onToggle={() => setExpandedHash(expandedHash === c.hash ? null : c.hash)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function CommitListItem({ 
  commit: c, 
  username, 
  repoName, 
  isExpanded, 
  onToggle 
}: { 
  commit: any, 
  username: string, 
  repoName: string,
  isExpanded: boolean,
  onToggle: () => void
}) {
  const { data: diffRes, isLoading: diffLoading } = useCommitDiff(username, repoName, c.hash)
  const diffs = diffRes?.success ? diffRes.data : []
  
  const nFiles = c.filesChanged?.length || 0
  const add = diffs.reduce((s: number, f: any) => s + f.additions, 0)
  const del = diffs.reduce((s: number, f: any) => s + f.deletions, 0)

  return (
    <li className="flex flex-col">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={onToggle}
          className="flex shrink-0 items-start gap-1 rounded text-left text-muted-foreground hover:text-foreground mt-1"
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="flex min-w-0 flex-1 gap-3">
          <Avatar className="size-10 shrink-0 rounded-full">
            <AvatarFallback className="bg-rs-accent text-white">{c.author[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium leading-snug text-white">{c.message}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-gray-300">{c.author}</span> committed {formatRelativeTime(c.timestamp)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {nFiles} file{nFiles === 1 ? '' : 's'} changed
              {(add + del > 0) && (
                <>
                  {' · '}
                  <span className="text-emerald-400">+{add}</span>
                  <span> </span>
                  <span className="text-red-400">−{del}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:pl-2">
          <Button variant="outline" size="sm" className="font-mono text-xs border-rs-border h-8" asChild>
            <Link to={`/${username}/${repoName}/commit/${c.hash}`}>
              {c.hash.slice(0, 7)}
            </Link>
          </Button>
          <CommitHash hash={c.hash} />
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-rs-border bg-black/20 px-3 pb-4 pt-2 sm:px-6">
          {diffLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin size-6 text-muted-foreground" />
            </div>
          ) : (
            <>
              <DiffViewer files={diffs} variant="compact" />
              <div className="mt-4 flex justify-end">
                <Button variant="link" size="sm" className="h-auto p-0 text-rs-link" asChild>
                  <Link to={`/${username}/${repoName}/commit/${c.hash}`}>
                    Open full commit diff →
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}
