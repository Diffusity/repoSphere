import {
  Book,
  ChevronDown,
  Circle,
  Code,
  Eye,
  FileCode2,
  FolderGit2,
  GitCommit,
  GitFork,
  GitPullRequest,
  History,
  Scale,
  Settings,
  Star,
  Loader2,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { RepositoryEntries } from '@/components/common/RepositoryEntries'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { RS_BRANCH_DEFAULT } from '@/lib/constants'
import { normalizeTreeSplat, repoBlobUrl, repoTreeUrl } from '@/lib/repoTree'
import { cn, formatRelativeTime, truncateHash } from '@/lib/utils'
import { 
  useRepository, 
  useRepositoryTree, 
  useBlobContent, 
  useCommits,
  useBranches,
  useStarStatus,
  useToggleStar,
  useForkRepository
} from '@/hooks/useRepository'
import { useIssues } from '@/hooks/useIssues'
import { getLanguageFromPath, highlightLines } from '@/lib/highlight'
import { useAuthStore } from '@/stores/authStore'
import { CommitList } from '@/components/repo/CommitList'
import { IssuesList } from '@/components/repo/IssuesList'
import { IssueDetail } from '@/components/repo/IssueDetail'
import { NewIssueForm } from '@/components/repo/NewIssueForm'
import { RepoSettings } from '@/components/repo/RepoSettings'
import { PullRequestList } from '@/components/repo/PullRequestList'
import { PullRequestDetail } from '@/components/repo/PullRequestDetail'
import { usePullRequests } from '@/hooks/useRepository'

export function RepositoryPage() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const username = params.username ?? ''
  const repoName = params.repoName ?? ''
  const branchFromRoute = params.branch
  const treeSplat = params['*']
  const isObjectRoute = branchFromRoute !== undefined
  const routeKind = location.pathname.includes('/blob/') ? 'blob' : 'tree'
  const branch = branchFromRoute ?? RS_BRANCH_DEFAULT
  const treePathInRepo = isObjectRoute ? normalizeTreeSplat(treeSplat) : ''

  const currentUser = useAuthStore((s) => s.user)
  const isOwner = currentUser?.username === username

  // Data Fetching
  const { data: repoRes, isLoading: repoLoading } = useRepository(username, repoName)
  const { data: treeRes, isLoading: treeLoading } = useRepositoryTree(username, repoName, branch, routeKind === 'tree' ? treePathInRepo : '')
  const { data: blobRes, isLoading: blobLoading } = useBlobContent(username, repoName, branch, treePathInRepo)
  const { data: commitsRes, isLoading: commitsLoading } = useCommits(username, repoName, branch)
  const { data: branchesRes } = useBranches(username, repoName)

  const repo = repoRes?.success ? repoRes.data : null
  const tree = treeRes?.success ? treeRes.data : []
  const blob = blobRes?.success ? blobRes.data : null
  const commits = commitsRes?.success ? commitsRes.data : []
  const branches = branchesRes?.success ? branchesRes.data : []
  const latest = commits[0]

  const { data: starRes } = useStarStatus(username, repoName)
  const toggleStar = useToggleStar()
  const forkRepo = useForkRepository()
  const isStarred = starRes?.success ? starRes.data.starred : false

  const isBlob = routeKind === 'blob'
  const isCommitsTab = location.pathname.includes('/commits')
  const isIssuesTab = location.pathname.includes('/issues')
  const isPullsTab = location.pathname.includes('/pulls')
  const isSettingsTab = location.pathname.includes('/settings')
  const isNewIssue = location.pathname.endsWith('/issues/new')
  const issueMatch = location.pathname.match(/\/issues\/(\d+)/)
  const issueNumber = issueMatch ? parseInt(issueMatch[1], 10) : null
  const pullMatch = location.pathname.match(/\/pulls\/(\d+)/)
  const pullNumber = pullMatch ? parseInt(pullMatch[1], 10) : null

  const { data: issuesCountRes } = useIssues(username, repoName, 'open', undefined, 1, 0)
  const openIssueCount = issuesCountRes?.success ? issuesCountRes.data.openCount : 0

  const { data: pullsRes } = usePullRequests(username, repoName)
  const openPullsCount = pullsRes?.success ? pullsRes.data.filter(pr => pr.status === 'open').length : 0

  const showReadme = (!isObjectRoute || (routeKind === 'tree' && treePathInRepo === '')) && !isCommitsTab && !isIssuesTab && !isPullsTab && !isSettingsTab

  const readmeEntry = useMemo(() => {
    if (!tree || routeKind !== 'tree' || treePathInRepo !== '') return null
    // Case-insensitive match for readme.md
    return tree.find(e => e.name.toLowerCase() === 'readme.md' && e.type === 'file')
  }, [tree, routeKind, treePathInRepo])

  const { data: readmeRes } = useBlobContent(
    username, 
    repoName, 
    branch, 
    readmeEntry ? `${treePathInRepo ? treePathInRepo + '/' : ''}${readmeEntry.name}` : ''
  )

  const readmeContent = useMemo(() => {
    if (!readmeRes?.success || !readmeRes.data) return null
    const b = readmeRes.data
    if (b.encoding === 'base64') {
      try { return atob(b.content) } catch { return null }
    }
    return b.content
  }, [readmeRes])

  const decodedContent = useMemo(() => {
    if (!blob) return ''
    if (blob.encoding === 'base64') {
      try {
        return atob(blob.content)
      } catch {
        return 'Unable to decode content'
      }
    }
    return blob.content
  }, [blob])

  const fileLines = useMemo(() => {
    if (!decodedContent) return []
    return decodedContent.split('\n').map((line, i) => ({
      number: i + 1,
      content: line
    }))
  }, [decodedContent])

  const language = useMemo(() => getLanguageFromPath(treePathInRepo), [treePathInRepo])

  const highlightedLines = useMemo(() => {
    if (!decodedContent) return []
    const lines = highlightLines(decodedContent, language)
    return lines.map((html, i) => ({ number: i + 1, html }))
  }, [decodedContent, language])

  if (repoLoading) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-8 py-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-semibold text-white">Repository not found</h1>
        <p className="mt-2 text-muted-foreground">The repository you are looking for does not exist or you don't have access.</p>
        <Button className="mt-6" asChild variant="outline">
          <Link to="/repositories">Back to repositories</Link>
        </Button>
      </div>
    )
  }

  const repoPath = `${username}/${repoName}`
  const linkContext = { username, repoName, branch }

  return (
    <div className="app-page max-w-[1280px]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Link to={`/${username}`} className="font-medium text-rs-link hover:underline">
              {username}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-rs-link">{repoName}</span>
            <Badge
              variant="secondary"
              className="rounded-full border border-rs-border bg-transparent px-2 text-[10px] font-medium capitalize text-muted-foreground"
            >
              {repo.visibility}
            </Badge>
          </div>

          {repo.forkedFrom && (
            <div className="text-xs text-muted-foreground">
              Forked from{' '}
              <Link to={`/${repo.forkedFrom.ownerUsername}/${repo.forkedFrom.name}`} className="text-rs-link hover:underline">
                {repo.forkedFrom.ownerUsername}/{repo.forkedFrom.name}
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white">{repo.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{repo.description?.trim() || 'No description provided.'}</span>
            <span className="inline-flex items-center gap-1.5">
              <Circle className="size-2 fill-current text-rs-warm" />
              {repo.language || 'Plain Text'}
            </span>
            <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <RepoActionButton icon={Eye} label="Watch" value="0" />
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-rs-border bg-rs-surface text-muted-foreground hover:bg-[#212830]"
            onClick={() => {
              if (!currentUser) {
                navigate('/login')
                return
              }
              if (!isOwner) {
                forkRepo.mutate({ owner: username, name: repoName }, {
                  onSuccess: (res) => {
                    if (res.success && res.data) {
                      navigate(`/${currentUser.username}/${res.data.name}`)
                    }
                  }
                })
              }
            }}
            disabled={isOwner || forkRepo.isPending}
          >
            <GitFork className="size-3.5" />
            Fork <span className="tabular-nums text-foreground">{repo.forks}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1 border-rs-border bg-rs-surface text-muted-foreground hover:bg-[#212830]",
              isStarred && "text-yellow-400"
            )}
            onClick={() => {
              if (!currentUser) {
                navigate('/login')
                return
              }
              toggleStar.mutate({ owner: username, name: repoName })
            }}
            disabled={toggleStar.isPending}
          >
            <Star className={cn("size-3.5", isStarred && "fill-yellow-400")} />
            {isStarred ? 'Starred' : 'Star'} <span className="tabular-nums text-foreground">{repo.stars}</span>
          </Button>
        </div>
      </header>

      {repo.sourceDeleted && (
        <div className="rounded-md border border-red-900 bg-red-950/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Scale className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">
                Source Repository Deleted
              </h3>
              <div className="mt-2 text-sm text-red-300">
                <p>
                  The source repository for this fork has been deleted. Push and pull operations are disabled. You may delete this repository.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-900 bg-red-950/50 text-red-400 hover:bg-red-900 hover:text-white"
                      onClick={() => navigate(`/${username}/${repoName}/settings`)}
                    >
                      Delete Repository
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="-mx-1 flex flex-wrap gap-1 border-b border-rs-border" aria-label="Repository">
        <TabItem 
          active={!isCommitsTab && !isIssuesTab && !isPullsTab && !isSettingsTab} 
          icon={Code} 
          label="Code" 
          to={`/${username}/${repoName}/tree/${branch}`} 
          asLink 
        />
        <TabItem 
          active={isCommitsTab} 
          icon={GitCommit} 
          label="Commits" 
          to={`/${username}/${repoName}/commits/${branch}`} 
          asLink 
        />
        <TabItem
          active={isIssuesTab}
          icon={CircleDot}
          label="Issues"
          to={`/${username}/${repoName}/issues`}
          asLink
          count={openIssueCount}
        />
        <TabItem
          active={isPullsTab}
          icon={GitPullRequest}
          label="Pull Requests"
          to={`/${username}/${repoName}/pulls`}
          asLink
          count={openPullsCount}
        />
        {isOwner && (
          <TabItem 
            active={isSettingsTab}
            icon={Settings} 
            label="Settings" 
            to={`/${username}/${repoName}/settings`} 
            asLink 
          />
        )}
      </nav>

      <div className={cn("grid gap-8", !isCommitsTab && !isIssuesTab && !isPullsTab && !isSettingsTab && !isPullsTab && "lg:grid-cols-[minmax(0,1fr)_296px]")}>
        <section className="min-w-0">
          {isCommitsTab ? (
            <CommitList username={username} repoName={repoName} branch={branch} />
          ) : isIssuesTab ? (
            isNewIssue ? (
              <NewIssueForm username={username} repoName={repoName} />
            ) : issueNumber ? (
              <IssueDetail username={username} repoName={repoName} issueNumber={issueNumber} />
            ) : (
              <IssuesList username={username} repoName={repoName} />
            )
          ) : isPullsTab ? (
            pullNumber ? (
              <PullRequestDetail username={username} repoName={repoName} pullNumber={pullNumber} />
            ) : (
              <PullRequestList username={username} repoName={repoName} />
            )
          ) : isSettingsTab ? (
            <RepoSettings username={username} repoName={repoName} />
          ) : (
            <div className="surface-panel overflow-hidden">
              {isObjectRoute ? (
                <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 border-b border-rs-border bg-rs-bg/50 px-4 py-2 text-sm text-muted-foreground">
                  <Link to={`/${username}/${repoName}/tree/${branch}`} className="shrink-0 font-semibold text-foreground hover:text-rs-link">
                    {repoName}
                  </Link>
                  <span>/</span>
                  <span>{routeKind}</span>
                  <span>/</span>
                  <Link to={repoTreeUrl(username, repoName, branch, '')} className="hover:text-rs-link">
                    {branch}
                  </Link>
                  {treePathInRepo.split('/').filter(Boolean).map((seg, i, arr) => {
                    const cum = arr.slice(0, i + 1).join('/')
                    const isLast = i === arr.length - 1
                    const href = (isLast && isBlob)
                      ? repoBlobUrl(username, repoName, branch, cum)
                      : repoTreeUrl(username, repoName, branch, cum)

                    return (
                      <Fragment key={cum}>
                        <span>/</span>
                        <Link to={href} className={cn('hover:text-rs-link', isLast && isBlob && 'text-foreground hover:text-foreground')}>
                          {seg}
                        </Link>
                      </Fragment>
                    )
                  })}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-b border-rs-border bg-rs-bg/50 px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 border-rs-border bg-rs-surface h-8 px-3 text-sm font-medium hover:bg-[#212830] transition-colors"
                    >
                      <GitFork className="size-3.5 text-muted-foreground" />
                      <span className="max-w-[120px] truncate">{branch}</span>
                      <ChevronDown className="size-3.5 text-muted-foreground opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-rs-surface border-rs-border p-1 shadow-xl">
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Switch branches/tags
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-rs-border" />
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {branches.length > 0 ? (
                        branches.map((b) => (
                          <DropdownMenuItem
                            key={b.name}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                              b.name === branch && "bg-rs-accent/10 text-rs-link font-semibold"
                            )}
                            onSelect={() => {
                              const targetUrl = isCommitsTab 
                                ? `/${username}/${repoName}/commits/${b.name}`
                                : `/${username}/${repoName}/tree/${b.name}`
                              navigate(targetUrl)
                            }}
                          >
                            <span className="truncate">{b.name}</span>
                            {b.name === branch && <div className="size-1.5 rounded-full bg-rs-link" />}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                            "bg-rs-accent/10 text-rs-link font-semibold"
                          )}
                          onSelect={() => {
                            const defaultBranch = repo?.defaultBranch || RS_BRANCH_DEFAULT
                            const targetUrl = isCommitsTab 
                              ? `/${username}/${repoName}/commits/${defaultBranch}`
                              : `/${username}/${repoName}/tree/${defaultBranch}`
                            navigate(targetUrl)
                          }}
                        >
                          <span className="truncate">{repo?.defaultBranch || RS_BRANCH_DEFAULT}</span>
                          <div className="size-1.5 rounded-full bg-rs-link" />
                        </DropdownMenuItem>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>


                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-rs-border bg-rs-surface px-3 text-muted-foreground"
                  asChild
                >
                  <Link to={`/${username}/${repoName}/commits/${branch}`}>
                    <History className="size-3.5" />
                    {commitsLoading ? '...' : commits.length} commits
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="ml-auto h-8 gap-1 border border-rs-border bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Code
                      <ChevronDown className="size-3.5 opacity-90" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 border-rs-border bg-rs-surface p-3 text-white">
                    <p className="text-xs font-medium text-muted-foreground">Clone with rs</p>
                    <pre className="mt-2 overflow-x-auto rounded-md border border-rs-border bg-rs-bg/70 p-2 font-mono text-xs text-foreground">
                      rs clone {repoPath}
                    </pre>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">HTTPS (placeholder)</p>
                    <pre className="mt-2 overflow-x-auto rounded-md border border-rs-border bg-rs-bg/70 p-2 font-mono text-xs text-foreground">
                      https://reposphere.vercel.app/{repoPath}
                    </pre>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {latest ? (
                <div className="flex flex-wrap items-center gap-3 border-b border-rs-border bg-rs-surface/80 px-4 py-3 text-sm">
                  <Avatar className="size-5 shrink-0 rounded-full">
                    <AvatarFallback className="rounded-full bg-rs-link text-[10px] text-white">
                      {latest.author[0]?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">{latest.author}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{latest.message}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Link to={`/${username}/${repoName}/commit/${latest.hash}`} className="font-mono text-rs-link hover:underline">
                      {truncateHash(latest.hash)}
                    </Link>
                    <span>{formatRelativeTime(latest.timestamp)}</span>
                  </div>
                </div>
              ) : null}

              {isBlob ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rs-border bg-rs-bg/50 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-mono text-sm text-foreground">{treePathInRepo}</p>
                        <p className="text-xs text-muted-foreground">{blobLoading ? 'Loading...' : `${fileLines.length} lines`}</p>
                      </div>
                    </div>
                    <Link to={repoTreeUrl(username, repoName, branch, treePathInRepo.split('/').slice(0, -1).join('/'))} className="text-sm text-rs-link hover:underline">
                      Browse folder
                    </Link>
                  </div>

                  <div className="max-h-[min(70vh,36rem)] overflow-auto bg-rs-bg/70">
                    {blobLoading ? (
                      <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin size-8 text-blue-500" />
                      </div>
                    ) : (
                      <table className="w-full border-collapse font-mono text-sm leading-6">
                        <tbody>
                          {highlightedLines.map((line) => (
                            <tr key={line.number} className="border-b border-rs-border/70 last:border-b-0">
                              <td className="w-14 select-none border-r border-rs-border px-3 text-right align-top text-xs text-muted-foreground">
                                {line.number}
                              </td>
                              <td className="px-4 py-0.5 text-foreground">
                                <span 
                                  className="whitespace-pre text-gray-300"
                                  dangerouslySetInnerHTML={{ __html: line.html || '&nbsp;' }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-0">
                  {treeLoading ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="animate-spin size-8 text-blue-500" />
                    </div>
                  ) : (
                    <RepositoryEntries entries={tree} linkContext={linkContext} pathPrefix={treePathInRepo} />
                  )}
                </div>
              )}

              {showReadme ? (
                <div className="border-t border-rs-border">
                  <div className="flex items-center gap-2 border-b border-rs-border bg-rs-bg/50 px-4 py-3">
                    <Book className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-white">README.md</span>
                  </div>
                  <div className="bg-rs-surface px-6 py-6">
                    {readmeContent ? (
                      <MarkdownRenderer content={readmeContent} />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {repo.description || 'No README found in this repository.'}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        {!isCommitsTab && !isIssuesTab && !isPullsTab && !isSettingsTab && (
          <aside className="space-y-6 text-sm">
            <section>
              <h2 className="mb-2 text-base font-semibold text-white">About</h2>
              <p className={cn('text-muted-foreground', !repo.description?.trim() && 'italic')}>
                {repo.description?.trim() || 'No description, website, or topics provided.'}
              </p>
              <ul className="mt-3 space-y-2">
                <li className="inline-flex items-center gap-2 text-muted-foreground">
                  <Circle className="size-2 fill-current text-rs-warm" />
                  {repo.language || 'Plain Text'}
                </li>
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
                <li className="inline-flex items-center gap-2 text-muted-foreground">
                  <Scale className="size-4" />
                  No license
                </li>
              </ul>
            </section>

            <Separator className="bg-rs-border" />

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">Releases</h2>
              <p className="text-muted-foreground text-xs font-mono">Coming soon...</p>
            </section>

            <Separator className="bg-rs-border" />

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">Packages</h2>
              <p className="text-muted-foreground text-xs font-mono">Coming soon...</p>
            </section>

            <Separator className="bg-rs-border" />

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">Contributors</h2>
              <div className="flex gap-1">
                <Avatar className="size-8 border border-rs-border">
                  <AvatarFallback className="bg-rs-accent text-[10px] text-white">{username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}

function RepoActionButton({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Button variant="outline" size="sm" className="gap-1 border-rs-border bg-rs-surface text-muted-foreground">
      <Icon className="size-3.5" />
      {label} <span className="tabular-nums text-foreground">{value}</span>
      <ChevronDown className="size-3.5 opacity-70" />
    </Button>
  )
}

function TabItem({
  active,
  disabled,
  asLink,
  to,
  icon: Icon,
  label,
  count,
}: {
  active?: boolean
  disabled?: boolean
  asLink?: boolean
  to?: string
  icon: LucideIcon
  label: string
  count?: number
}) {
  const className = cn(
    '-mb-px inline-flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2.5 text-sm transition-colors',
    active
      ? 'border-rs-accent font-semibold text-foreground'
      : 'border-transparent text-muted-foreground',
    !disabled && !active && 'hover:border-rs-border hover:bg-rs-surface/60 hover:text-foreground',
    disabled && 'cursor-not-allowed opacity-50'
  )

  const inner = (
    <>
      <Icon className="size-4 shrink-0 opacity-80" />
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 rounded-full bg-rs-accent/20 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
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
