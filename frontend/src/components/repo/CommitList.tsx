import { ChevronDown, ChevronRight, GitCommit, History, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CommitHash } from '@/components/common/CommitHash'
import { DiffViewer } from '@/components/common/DiffViewer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCommitDate, formatRelativeTime } from '@/lib/utils'
import { useCommitDiff, useCommits } from '@/hooks/useRepository'
import type { Commit, DiffFile } from '@/types'

interface CommitListProps {
  username: string
  repoName: string
  branch: string
}

export function CommitList({ username, repoName, branch }: CommitListProps) {
  const { data: commitsRes, isLoading: commitsLoading } = useCommits(username, repoName, branch)
  const commits = useMemo(() => (commitsRes?.success ? commitsRes.data : []), [commitsRes])
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

  if (commitsLoading && commits.length === 0) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-lg border border-rs-border bg-rs-surface/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {byDate.length === 0 ? (
        <div className="rounded-lg border border-dashed border-rs-border bg-rs-surface py-12 text-center">
          <GitCommit className="mx-auto mb-4 size-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No commits found for this branch.</p>
        </div>
      ) : (
        byDate.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-4 flex items-center gap-2 border-b border-rs-border pb-2 text-sm font-semibold text-muted-foreground">
              <History className="size-4" />
              Commits on {label}
            </h2>
            <ul className="divide-y divide-rs-border/80 overflow-hidden rounded-lg border border-rs-border bg-rs-surface/90">
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
  )
}

function CommitListItem({
  commit: c,
  username,
  repoName,
  isExpanded,
  onToggle,
}: {
  commit: Commit
  username: string
  repoName: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data: diffRes, isLoading: diffLoading } = useCommitDiff(username, repoName, c.hash)
  const diffs = diffRes?.success ? diffRes.data : []

  const nFiles = c.filesChanged?.length || 0
  const add = diffs.reduce((s: number, f: DiffFile) => s + f.additions, 0)
  const del = diffs.reduce((s: number, f: DiffFile) => s + f.deletions, 0)

  return (
    <li className="flex flex-col">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 flex shrink-0 items-start gap-1 rounded-md text-left text-muted-foreground hover:text-foreground"
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
              {add + del > 0 && (
                <>
                  {' · '}
                  <span className="text-emerald-400">+{add}</span>
                  <span> </span>
                  <span className="text-red-400">-{del}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:pl-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 border-rs-border bg-transparent font-mono text-xs sm:flex"
            asChild
            title="Browse files at this commit"
          >
            <Link to={`/${username}/${repoName}/tree/${c.hash}`}>Browse files</Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 border-rs-border font-mono text-xs" asChild>
            <Link to={`/${username}/${repoName}/commit/${c.hash}`}>{c.hash.slice(0, 7)}</Link>
          </Button>
          <CommitHash hash={c.hash} />
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-rs-border bg-rs-bg/35 px-3 pb-4 pt-2 sm:px-6">
          {diffLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <DiffViewer files={diffs} variant="compact" />
              <div className="mt-4 flex justify-end">
                <Button variant="link" size="sm" className="h-auto p-0 text-rs-link" asChild>
                  <Link to={`/${username}/${repoName}/commit/${c.hash}`}>Open full commit diff</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}
