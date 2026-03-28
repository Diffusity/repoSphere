import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CommitHash } from '@/components/common/CommitHash'
import { DiffViewer } from '@/components/common/DiffViewer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCommitDate, formatRelativeTime } from '@/lib/utils'
import { getMockCommitsForRepo, getMockRepo, mockDiffForCommit } from '@/lib/mockData'

export function CommitListPage() {
  const { username = '', repoName = '' } = useParams()
  const repo = getMockRepo(username, repoName)
  const commits = getMockCommitsForRepo(username, repoName)
  const repoKey = `${username}/${repoName}`
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

  if (!repo) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        Unknown repository
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link to={`/${username}/${repoName}`} className="text-rs-link hover:underline">
            {username}/{repoName}
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Commits on {repo.defaultBranch}</h1>
      </div>

      <div className="space-y-10">
        {byDate.map(([label, list]) => (
          <section key={label}>
            <h2 className="mb-4 border-b border-rs-border pb-2 text-sm font-semibold text-muted-foreground">
              Commits on {label}
            </h2>
            <ul className="divide-y divide-rs-border rounded-lg border border-rs-border bg-rs-surface">
              {list.map((c) => {
                const open = expandedHash === c.hash
                const files = mockDiffForCommit(repoKey, c.hash)
                const nFiles = c.filesChanged.length
                const add = files.reduce((s, f) => s + f.additions, 0)
                const del = files.reduce((s, f) => s + f.deletions, 0)
                return (
                  <li key={c.hash} className="flex flex-col">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                      <button
                        type="button"
                        onClick={() => setExpandedHash(open ? null : c.hash)}
                        className="flex shrink-0 items-start gap-1 rounded text-left text-muted-foreground hover:text-foreground"
                        aria-expanded={open}
                        aria-label={open ? 'Hide file changes' : 'Show file changes'}
                      >
                        {open ? <ChevronDown className="mt-1 size-4" /> : <ChevronRight className="mt-1 size-4" />}
                      </button>
                      <div className="flex min-w-0 flex-1 gap-3">
                        <Avatar className="size-10 shrink-0">
                          <AvatarFallback>{c.author[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{c.message}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {c.author} committed {formatRelativeTime(c.timestamp)}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {nFiles} file{nFiles === 1 ? '' : 's'} changed
                            {add + del > 0 ? (
                              <>
                                {' · '}
                                <span className="text-emerald-400">+{add}</span>
                                <span> </span>
                                <span className="text-red-400">−{del}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:pl-2">
                        <Button variant="outline" size="sm" className="font-mono text-xs" asChild>
                          <Link to={`/${username}/${repoName}/commit/${c.hash}`}>
                            {c.hash.slice(0, 7)}
                          </Link>
                        </Button>
                        <CommitHash hash={c.hash} />
                      </div>
                    </div>
                    {open ? (
                      <div className="border-t border-rs-border bg-rs-bg/40 px-3 pb-4 pt-2 sm:px-6">
                        <DiffViewer files={files} variant="compact" />
                        <div className="mt-3 flex justify-end">
                          <Button variant="link" size="sm" className="h-auto p-0 text-rs-link" asChild>
                            <Link to={`/${username}/${repoName}/commit/${c.hash}`}>
                              Open full commit diff →
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
