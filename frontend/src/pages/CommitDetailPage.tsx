import { Link, useParams } from 'react-router-dom'
import { DiffViewer } from '@/components/common/DiffViewer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMockCommitsForRepo, getMockRepo, mockDiffForCommit } from '@/lib/mockData'
import { formatRelativeTime, truncateHash } from '@/lib/utils'

export function CommitDetailPage() {
  const { username = '', repoName = '', hash = '' } = useParams()
  const repo = getMockRepo(username, repoName)
  const commits = getMockCommitsForRepo(username, repoName)
  const commit = commits.find((c) => c.hash === hash || c.hash.startsWith(hash))
  const repoKey = `${username}/${repoName}`
  const files = commit ? mockDiffForCommit(repoKey, commit.hash) : []

  const additions = files.reduce((s, f) => s + f.additions, 0)
  const deletions = files.reduce((s, f) => s + f.deletions, 0)

  if (!repo || !commit) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-muted-foreground">Commit not found.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to={`/${username}/${repoName}/commits`}>Back to commits</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link to={`/${username}/${repoName}`} className="text-rs-link hover:underline">
          {username}/{repoName}
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/${username}/${repoName}/commits`} className="text-rs-link hover:underline">
          commits
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground">{truncateHash(commit.hash)}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold leading-snug">{commit.message}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{commit.author}</span>
          <span>{commit.authorEmail}</span>
          <span>committed {formatRelativeTime(commit.timestamp)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
          <Badge variant="outline" className="font-mono">
            {commit.hash}
          </Badge>
          {commit.parent && commit.parent !== '0000000000000000' ? (
            <Button variant="outline" size="sm" className="h-7 font-mono" asChild>
              <Link to={`/${username}/${repoName}/commit/${commit.parent}`}>
                parent {truncateHash(commit.parent)}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 rounded-md border border-rs-border bg-rs-surface px-4 py-3 text-sm">
        <span>
          <strong className="text-foreground">{files.length}</strong> files changed
        </span>
        <span className="text-emerald-400">+{additions}</span>
        <span className="text-red-400">−{deletions}</span>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Changed files</h2>
        <DiffViewer files={files} />
      </div>
    </div>
  )
}
