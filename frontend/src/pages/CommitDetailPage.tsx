import { ChevronLeft, GitCommit, Loader2 } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { CommitHash } from '@/components/common/CommitHash'
import { DiffViewer } from '@/components/common/DiffViewer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, truncateHash } from '@/lib/utils'
import { useCommitDetail, useCommitDiff, useRepository } from '@/hooks/useRepository'

export function CommitDetailPage() {
  const { username = '', repoName = '', hash = '' } = useParams()

  const { data: repoRes, isLoading: repoLoading } = useRepository(username, repoName)
  const { data: commitRes, isLoading: commitLoading } = useCommitDetail(username, repoName, hash)
  const { data: diffRes, isLoading: diffLoading } = useCommitDiff(username, repoName, hash)

  const repo = repoRes?.success ? repoRes.data : null
  const commit = commitRes?.success ? commitRes.data : null
  const diffs = diffRes?.success ? diffRes.data : []

  if (commitLoading || repoLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!commit || !repo) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        Commit or repository not found
      </div>
    )
  }

  const nFiles = commit.filesChanged?.length || 0
  const add = diffs.reduce((s, f) => s + f.additions, 0)
  const del = diffs.reduce((s, f) => s + f.deletions, 0)

  return (
    <div className="app-page max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={`/${username}/${repoName}/commits`} className="flex items-center gap-1 hover:text-rs-link">
          <ChevronLeft className="size-4" />
          Back to commits
        </Link>
      </div>

      <PageHeader
        badge="Commit detail"
        title={commit.message}
        description={`${username}/${repoName}`}
        icon={GitCommit}
        meta={
          <>
            <span className="page-meta-pill">{formatRelativeTime(commit.timestamp)}</span>
            <span className="page-meta-pill">{nFiles} changed file{nFiles === 1 ? '' : 's'}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 border-rs-border bg-transparent font-mono text-xs" asChild>
              <Link to={`/${username}/${repoName}/tree/${commit.hash}`}>Browse files</Link>
            </Button>
            <CommitHash hash={commit.hash} />
          </>
        }
      />

      <header className="surface-panel overflow-hidden">
        <div className="border-b border-rs-border bg-rs-bg/45 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="shrink-0 -ml-2 text-muted-foreground hover:text-white">
                <Link to={`/${username}/${repoName}`} title="Back to repository">
                  <ChevronLeft className="size-6" />
                </Link>
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-white">Commit overview</h2>
                {commit.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{commit.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-6 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="size-6 shrink-0 rounded-full">
              <AvatarFallback className="bg-rs-accent text-[10px] text-white">
                {commit.author[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-white">{commit.author}</span>
            <span className="text-muted-foreground">
              committed {formatRelativeTime(commit.timestamp)}
            </span>
          </div>
          <Separator orientation="vertical" className="hidden h-4 bg-rs-border sm:block" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitCommit className="size-3.5" />
              1 parent <span className="font-mono text-rs-link hover:underline cursor-pointer">{truncateHash(commit.hash)}</span>
            </span>
            <span>commit <span className="font-mono text-white">{commit.hash}</span></span>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Showing {nFiles} changed file{nFiles === 1 ? '' : 's'} with{' '}
          <span className="text-emerald-400 font-semibold">+{add} additions</span> and{' '}
          <span className="font-semibold text-red-400">-{del} deletions</span>
        </h2>
      </div>

      {diffLoading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-rs-border bg-rs-surface py-20">
          <Loader2 className="mb-4 size-10 animate-spin text-rs-link" />
          <p className="text-muted-foreground">Loading diffs...</p>
        </div>
      ) : (
        <DiffViewer files={diffs} className="pb-12" />
      )}
    </div>
  )
}
