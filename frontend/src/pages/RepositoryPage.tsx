import {
  Book,
  ChevronDown,
  Code,
  Eye,
  FolderGit2,
  GitCommit,
  GitFork,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { Fragment } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RepositoryEntries } from '@/components/common/RepositoryEntries'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RS_BRANCH_DEFAULT } from '@/lib/constants'
import { getMockCommitsForRepo, getMockRepo, mockReadmeByRepo } from '@/lib/mockData'
import { normalizeTreeSplat, repoBlobUrl, repoTreeUrl, resolveTreePath } from '@/lib/repoTree'
import { cn, formatRelativeTime, truncateHash } from '@/lib/utils'

export function RepositoryPage() {
  const params = useParams()
  const location = useLocation()
  const username = params.username ?? ''
  const repoName = params.repoName ?? ''
  const branchFromRoute = params.branch
  const treeSplat = params['*']
  const isObjectRoute = branchFromRoute !== undefined
  const routeKind = location.pathname.includes('/blob/') ? 'blob' : 'tree'
  const branch = branchFromRoute ?? RS_BRANCH_DEFAULT
  const treePathInRepo = isObjectRoute ? normalizeTreeSplat(treeSplat) : ''

  const repo = getMockRepo(username, repoName)
  const commits = getMockCommitsForRepo(username, repoName)
  const latest = commits[0]
  const readme = mockReadmeByRepo[`${username}/${repoName}`] ?? '# README\n\n_No readme for this mock repository._'
  const tree = latest?.tree ?? []

  const resolved = isObjectRoute
    ? resolveTreePath(tree, treePathInRepo)
    : ({ kind: 'dir', entries: tree, pathPrefix: '' } as const)

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

  if (isObjectRoute && resolved.kind === 'notFound') {
    return (
      <div className="mx-auto max-w-[1280px] py-16 text-center">
        <h1 className="text-xl font-semibold">Path not found</h1>
        <p className="mt-2 text-muted-foreground">
          No file or folder <span className="font-mono text-foreground">{treePathInRepo || '(empty)'}</span> in this
          tree.
        </p>
        <Button className="mt-6" asChild variant="outline">
          <Link to={`/${username}/${repoName}`}>Back to repository</Link>
        </Button>
      </div>
    )
  }

  const repoPath = `${username}/${repoName}`
  const linkContext = { username, repoName, branch }
  const showReadme = !isObjectRoute || treePathInRepo === ''
  const routeLabel = resolved.kind === 'file' || routeKind === 'blob' ? 'blob' : 'tree'

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Link to={`/${username}`} className="hover:text-rs-link">
              {username}
            </Link>
            <span className="text-rs-border">/</span>
            <span className="font-medium text-foreground">{repoName}</span>
            <Badge variant="secondary" className="border border-rs-border text-[10px] font-normal capitalize">
              {repo.visibility}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-5 shrink-0 text-rs-accent" aria-hidden />
            <h1 className="truncate text-xl font-semibold tracking-tight">{repo.name}</h1>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" size="sm" className="gap-1 border-rs-border bg-rs-surface text-muted-foreground">
            <Eye className="size-3.5" />
            Watch <span className="tabular-nums text-foreground">0</span>
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-rs-border bg-rs-surface text-muted-foreground">
            <GitFork className="size-3.5" />
            Fork <span className="tabular-nums text-foreground">{repo.forks}</span>
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-rs-border bg-rs-surface text-muted-foreground">
            <Star className="size-3.5" />
            Star <span className="tabular-nums text-foreground">{repo.stars}</span>
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
        </div>
      </div>

      <nav className="-mx-1 mt-5 flex flex-wrap gap-1 border-b border-rs-border" aria-label="Repository">
        <TabItem active icon={Code} label="Code" />
        <TabItem icon={GitCommit} label="Commits" to={`/${username}/${repoName}/commits`} asLink />
        <TabItem icon={Book} label="Issues" disabled />
        <TabItem icon={Settings} label="Settings" disabled />
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-md border border-rs-border bg-rs-surface">
            {isObjectRoute ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 border-b border-rs-border bg-rs-bg px-3 py-2 text-sm text-muted-foreground">
                <Link
                  to={`/${username}/${repoName}`}
                  className="shrink-0 font-semibold text-foreground hover:text-rs-link"
                >
                  {repoName}
                </Link>
                <span>/</span>
                <span>{routeLabel}</span>
                <span>/</span>
                <Link to={repoTreeUrl(username, repoName, branch, '')} className="hover:text-rs-link">
                  {branch}
                </Link>
                {treePathInRepo.split('/').filter(Boolean).map((seg, i, arr) => {
                  const cum = arr.slice(0, i + 1).join('/')
                  const isLast = i === arr.length - 1
                  const fileLeaf = isLast && resolved.kind === 'file'
                  const href = fileLeaf
                    ? repoBlobUrl(username, repoName, branch, cum)
                    : repoTreeUrl(username, repoName, branch, cum)
                  return (
                    <Fragment key={cum}>
                      <span>/</span>
                      <Link
                        to={href}
                        className={cn('hover:text-rs-link', fileLeaf && 'text-foreground hover:text-foreground')}
                      >
                        {seg}
                      </Link>
                    </Fragment>
                  )
                })}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 border-b border-rs-border bg-rs-bg px-3 py-2">
              <div className="flex items-center gap-2 rounded-md border border-rs-border bg-rs-surface px-2 py-1 text-sm">
                <span className="text-muted-foreground">Branch</span>
                <select
                  className="max-w-28 cursor-not-allowed bg-transparent font-mono text-sm text-foreground opacity-90 outline-none"
                  value={branch}
                  disabled
                  aria-label="Branch"
                >
                  <option value={RS_BRANCH_DEFAULT}>{RS_BRANCH_DEFAULT}</option>
                </select>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="ml-auto h-8 gap-1 border border-transparent bg-rs-accent text-white hover:bg-rs-accent/90"
                  >
                    Code
                    <ChevronDown className="size-3.5 opacity-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 border-rs-border bg-rs-surface p-3">
                  <p className="text-xs font-medium text-muted-foreground">Clone with rs</p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-rs-border bg-rs-bg p-2 font-mono text-xs text-foreground">
                    rs clone {repoPath}
                  </pre>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">HTTPS (placeholder)</p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-rs-border bg-rs-bg p-2 font-mono text-xs text-foreground">
                    https://reposphere.dev/{repoPath}.git
                  </pre>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {latest ? (
              <div className="flex flex-wrap items-center gap-3 border-b border-rs-border px-3 py-2.5 text-sm">
                <Avatar className="size-6 shrink-0 rounded-sm">
                  <AvatarFallback className="rounded-sm bg-violet-600 text-[10px] text-white">
                    {latest.author[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{latest.author}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-foreground">{latest.message}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:ml-auto">
                  <Link
                    to={`/${username}/${repoName}/commit/${latest.hash}`}
                    className="font-mono text-rs-link hover:underline"
                  >
                    {truncateHash(latest.hash)}
                  </Link>
                  <span>{formatRelativeTime(latest.timestamp)}</span>
                  <Link
                    to={`/${username}/${repoName}/commits`}
                    className="flex items-center gap-1 text-rs-link hover:underline"
                  >
                    <GitCommit className="size-3.5" />
                    {commits.length} Commits
                  </Link>
                </div>
              </div>
            ) : null}

            {resolved.kind === 'file' ? (
              <div className="border-t border-rs-border">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rs-border bg-rs-bg/50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Blob</p>
                    <p className="font-mono text-sm text-foreground">{resolved.pathPrefix}</p>
                  </div>
                  <Link
                    to={repoTreeUrl(username, repoName, branch, resolved.pathPrefix.split('/').slice(0, -1).join('/'))}
                    className="text-sm text-rs-link hover:underline"
                  >
                    Browse containing folder
                  </Link>
                </div>
                <pre className="max-h-[min(70vh,32rem)] overflow-auto bg-rs-bg px-4 py-4 font-mono text-sm leading-relaxed text-muted-foreground">
                  {`/* Mock preview */\n// ${resolved.entry.name}${resolved.entry.hash ? ` (hash: ${resolved.entry.hash})` : ''}\n`}
                </pre>
              </div>
            ) : resolved.kind === 'dir' ? (
              <div className="px-3 py-3">
                <RepositoryEntries
                  entries={resolved.entries}
                  linkContext={linkContext}
                  pathPrefix={resolved.pathPrefix}
                />
              </div>
            ) : null}

            {showReadme ? (
              <div className="border-t border-rs-border">
                <div className="flex items-center gap-2 border-b border-rs-border bg-rs-bg/50 px-4 py-2">
                  <Book className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">README</span>
                </div>
                <div className="px-4 py-4">
                  <article className="max-w-none text-muted-foreground">
                    <ReadmeMarkdown source={readme} />
                  </article>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6 text-sm">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">About</h2>
            <p
              className={cn(
                'text-muted-foreground',
                !repo.description?.trim() && 'italic'
              )}
            >
              {repo.description?.trim() || 'No description, website, or topics provided.'}
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>
                <a href="#" className="text-rs-link hover:underline">
                  Activity
                </a>
              </li>
              <li>
                <a href="#" className="text-rs-link hover:underline">
                  {repo.stars} stars
                </a>
              </li>
              <li>
                <a href="#" className="text-rs-link hover:underline">
                  0 watching
                </a>
              </li>
              <li>
                <a href="#" className="text-rs-link hover:underline">
                  {repo.forks} forks
                </a>
              </li>
              <li>
                <a href="#" className="text-rs-link hover:underline">
                  Report repository
                </a>
              </li>
            </ul>
          </section>

          <Separator className="bg-rs-border" />

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">Releases</h2>
            <p className="text-muted-foreground">No releases published</p>
            <a href="#" className="mt-1 inline-block text-rs-link hover:underline">
              Create a new release
            </a>
          </section>

          <Separator className="bg-rs-border" />

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">Packages</h2>
            <p className="text-muted-foreground">No packages published</p>
            <a href="#" className="mt-1 inline-block text-rs-link hover:underline">
              Publish your first package
            </a>
          </section>

          <Separator className="bg-rs-border" />

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">Contributors {commits.length || 3}</h2>
            <div className="flex gap-1">
              {['A', 'B', 'C'].map((c, i) => (
                <Avatar key={i} className="size-8 border border-rs-border">
                  <AvatarFallback className="bg-rs-accent text-[10px] text-white">{c}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function TabItem({
  active,
  disabled,
  asLink,
  to,
  icon: Icon,
  label,
}: {
  active?: boolean
  disabled?: boolean
  asLink?: boolean
  to?: string
  icon: LucideIcon
  label: string
}) {
  const className = cn(
    '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors',
    active
      ? 'border-rs-accent font-semibold text-foreground'
      : 'border-transparent text-muted-foreground',
    !disabled && !active && 'hover:border-rs-border hover:text-foreground',
    disabled && 'cursor-not-allowed opacity-50'
  )

  const inner = (
    <>
      <Icon className="size-4 shrink-0 opacity-80" />
      {label}
    </>
  )

  if (asLink && to && !disabled) {
    return (
      <Link to={to} className={cn(className, 'hover:border-rs-border')}>
        {inner}
      </Link>
    )
  }

  return (
    <span className={className} aria-current={active ? 'page' : undefined}>
      {inner}
    </span>
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
