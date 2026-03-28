import { Book, Code, GitCommit, Settings } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DiffViewer } from '@/components/common/DiffViewer'
import { FileTree } from '@/components/common/FileTree'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RS_BRANCH_DEFAULT } from '@/lib/constants'
import { getMockCommitsForRepo, getMockRepo, mockDiffForCommit, mockReadmeByRepo } from '@/lib/mockData'
import { formatRelativeTime, truncateHash } from '@/lib/utils'

export function RepositoryPage() {
  const { username = '', repoName = '' } = useParams()
  const repo = getMockRepo(username, repoName)
  const commits = getMockCommitsForRepo(username, repoName)
  const latest = commits[0]
  const readme = mockReadmeByRepo[`${username}/${repoName}`] ?? '# README\n\n_No readme for this mock repository._'
  const tree = latest?.tree ?? []

  if (!repo) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-semibold">Repository not found</h1>
        <p className="mt-2 text-muted-foreground">Try a mock path like /john_doe/my-project</p>
        <Button className="mt-6" asChild variant="outline">
          <Link to="/repositories">Back to repositories</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/${username}`} className="hover:text-rs-link">
            {username}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{repoName}</span>
          <Badge variant="secondary" className="text-[10px]">
            {repo.visibility}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold">{repo.name}</h1>
        <p className="text-muted-foreground">{repo.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{repo.stars} stars</span>
          <span>{repo.forks} forks</span>
          <span>Watchers (mock)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-rs-border pb-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-rs-elevated px-3 py-1.5 text-sm font-medium">
          <Code className="size-3.5" />
          Code
        </span>
        <Link
          to={`/${username}/${repoName}/commits`}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-rs-elevated hover:text-foreground"
        >
          <GitCommit className="size-3.5" />
          Commits
        </Link>
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground/50">
          <Book className="size-3.5" />
          Issues
        </span>
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground/50">
          <Settings className="size-3.5" />
          Settings
        </span>
      </div>

      <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-rs-border bg-rs-surface px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Branch</span>
              <select
                className="bg-transparent font-mono text-foreground outline-none"
                defaultValue={RS_BRANCH_DEFAULT}
                aria-label="Branch"
              >
                <option value={RS_BRANCH_DEFAULT}>{RS_BRANCH_DEFAULT}</option>
              </select>
            </div>
          </div>

          {latest ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-rs-border bg-rs-surface px-4 py-3 text-sm">
              <span className="font-medium">{latest.author}</span>
              <span className="truncate text-muted-foreground">{latest.message}</span>
              <Badge variant="outline" className="ml-auto font-mono text-xs">
                {truncateHash(latest.hash)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(latest.timestamp)}
              </span>
            </div>
          ) : null}

          {latest ? (
            <Card className="border-rs-border bg-rs-surface">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Commit differences</CardTitle>
                <Button variant="link" className="h-auto p-0 text-sm text-rs-link" asChild>
                  <Link to={`/${username}/${repoName}/commit/${latest.hash}`}>
                    Commit {truncateHash(latest.hash)} →
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <DiffViewer files={mockDiffForCommit(`${username}/${repoName}`, latest.hash)} />
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-rs-border bg-rs-surface lg:col-span-2">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Files</h3>
                <FileTree entries={tree} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="border-rs-border bg-rs-surface">
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-semibold">Clone with rs</p>
                  <pre className="overflow-x-auto rounded-md bg-rs-bg p-3 font-mono text-xs">
                    rs clone {username}/{repoName}
                  </pre>
                  <Separator />
                  <p className="font-semibold">HTTPS (placeholder)</p>
                  <pre className="overflow-x-auto rounded-md bg-rs-bg p-3 font-mono text-xs">
                    https://reposphere.dev/{username}/{repoName}.git
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-rs-border bg-rs-surface">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">README</h3>
              <article className="max-w-none text-muted-foreground">
                <ReadmeMarkdown source={readme} />
              </article>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

/** Tiny markdown-ish renderer for demo (headings, bold, code fences). */
function ReadmeMarkdown({ source }: { source: string }) {
  const blocks = source.split('```')
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (i % 2 === 1) {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md border border-rs-border bg-rs-bg p-4 font-mono text-xs"
            >
              {block.replace(/^\w*\n/, '')}
            </pre>
          )
        }
        return (
          <div key={i} className="space-y-2 whitespace-pre-wrap">
            {block.split('\n').map((line, li) => {
              if (line.startsWith('# ')) {
                return (
                  <h2 key={li} className="text-xl font-semibold text-foreground">
                    {line.slice(2)}
                  </h2>
                )
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={li} className="text-lg font-semibold">
                    {line.slice(3)}
                  </h3>
                )
              }
              const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
              return (
                <p key={li} className="text-sm leading-relaxed">
                  {parts.map((p, pi) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                      return (
                        <strong key={pi} className="text-foreground">
                          {p.slice(2, -2)}
                        </strong>
                      )
                    }
                    if (p.startsWith('`') && p.endsWith('`')) {
                      return (
                        <code
                          key={pi}
                          className="rounded bg-rs-elevated px-1 py-0.5 font-mono text-xs text-emerald-200"
                        >
                          {p.slice(1, -1)}
                        </code>
                      )
                    }
                    return <span key={pi}>{p}</span>
                  })}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
