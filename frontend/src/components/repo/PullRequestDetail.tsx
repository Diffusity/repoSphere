import { Link } from 'react-router-dom'
import { GitPullRequest, GitMerge, Loader2, AlertCircle, CheckCircle2, CircleDot, History, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePullRequestDetail, useMergePullRequest, useUpdatePullRequest, useRepository } from '@/hooks/useRepository'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { useAuthStore } from '@/stores/authStore'

interface PullRequestDetailProps {
  username: string
  repoName: string
  pullNumber: number
}

export function PullRequestDetail({ username, repoName, pullNumber }: PullRequestDetailProps) {
  const currentUser = useAuthStore(s => s.user)
  
  const { data: repoRes } = useRepository(username, repoName)
  const { data: prRes, isLoading } = usePullRequestDetail(username, repoName, pullNumber)
  const mergeMutation = useMergePullRequest()
  const updateMutation = useUpdatePullRequest()

  const repo = repoRes?.success ? repoRes.data : null
  const pr = prRes?.success ? prRes.data : null
  
  const isRepoOwner = currentUser?.username === username
  const isAuthor = currentUser?.username === pr?.authorUsername

  if (isLoading || !repo) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pr) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground text-sm">
        Pull request not found
      </div>
    )
  }

  const handleMerge = () => {
    if (!pr.isMergeable || pr.status !== 'open') return
    mergeMutation.mutate({ owner: username, name: repoName, number: pullNumber })
  }

  const handleToggleStatus = () => {
    const newStatus = pr.status === 'open' ? 'closed' : 'open'
    updateMutation.mutate({
      owner: username,
      name: repoName,
      number: pullNumber,
      payload: { status: newStatus }
    })
  }

  return (
    <div className="py-2">
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {pr.title}
          </h1>
          <span className="text-3xl font-light text-muted-foreground">#{pr.number}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge
            variant="secondary"
            className={cn(
              'gap-1.5 rounded-full px-3 py-1 font-medium text-white transition-colors',
              pr.status === 'open' ? 'bg-green-600 hover:bg-green-700' : 
              pr.status === 'merged' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {pr.status === 'open' && <CircleDot className="size-4" />}
            {pr.status === 'merged' && <GitMerge className="size-4" />}
            {pr.status === 'closed' && <CheckCircle2 className="size-4" />}
            {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
          </Badge>
          
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{pr.authorUsername}</span>
            <span>wants to merge into</span>
            <Badge variant="outline" className="font-mono text-xs px-1.5 bg-rs-bg/30">{pr.baseBranch}</Badge>
            <span>from</span>
            <Badge variant="outline" className="font-mono text-xs px-1.5 bg-rs-bg/30 text-purple-400">{pr.compareBranch}</Badge>
          </div>
        </div>
      </div>

      <Separator className="mb-8 bg-rs-border/60" />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_256px]">
        {/* Left Column: Timeline */}
        <div className="space-y-8">
          {/* PR Description */}
          <div className="flex gap-4">
            <Avatar className="mt-1 size-10 shrink-0 border border-rs-border shadow-sm">
              <AvatarFallback className="bg-rs-accent text-white">{pr.authorUsername[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-md border border-rs-border bg-rs-surface shadow-sm overflow-hidden">
              <div className="border-b border-rs-border bg-rs-bg/50 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{pr.authorUsername}</span>
                  {' commented '}
                  {formatRelativeTime(pr.createdAt)}
                </div>
                {pr.authorUsername === repo?.ownerUsername && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground/60 border-rs-border/50">Owner</Badge>
                )}
              </div>
              <div className="px-4 py-4 text-sm text-foreground leading-relaxed">
                {pr.description ? (
                  <MarkdownRenderer content={pr.description} />
                ) : (
                  <span className="italic text-muted-foreground">No description provided.</span>
                )}
              </div>
            </div>
          </div>

          {/* Merge Status Box / Action Box */}
          <div className="flex gap-4 border-t border-rs-border/40 pt-8">
            <div className="mt-1 size-10 flex items-center justify-center shrink-0">
               <Avatar className="size-8 border border-rs-border opacity-50">
                  <AvatarFallback className="bg-rs-bg text-muted-foreground text-[10px]">
                    {currentUser?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
               </Avatar>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className={cn(
                "rounded-md border shadow-sm overflow-hidden",
                pr.status === 'merged' ? "border-purple-500/30 bg-purple-500/5" :
                pr.status === 'open' && pr.isMergeable ? "border-green-500/30 bg-green-500/5" :
                pr.status === 'open' && !pr.isMergeable ? "border-red-500/30 bg-red-500/5" :
                "border-rs-border bg-rs-surface"
              )}>
                <div className="p-4">
                  {pr.status === 'merged' ? (
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-500 p-1.5 rounded-full mt-0.5">
                        <GitMerge className="size-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Pull request successfully merged</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Commit <Link to={`/${username}/${repoName}/commit/${pr.mergeCommitHash}`} className="font-mono text-rs-link hover:underline">{pr.mergeCommitHash?.slice(0, 7)}</Link> was added to {pr.baseBranch}.
                        </p>
                      </div>
                    </div>
                  ) : pr.status === 'open' ? (
                    <>
                      {pr.isMergeable ? (
                        <div className="flex items-start gap-4">
                          <div className="bg-green-600 p-1.5 rounded-full mt-0.5">
                            <CheckCircle2 className="size-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white">This branch has no conflicts with the base branch</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Merging can be performed automatically.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button 
                                size="sm"
                                onClick={handleMerge}
                                disabled={mergeMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                              >
                                {mergeMutation.isPending ? <Loader2 className="mr-2 size-3 animate-spin" /> : <GitMerge className="mr-2 size-3" />}
                                Merge pull request
                              </Button>
                              {(isAuthor || isRepoOwner) && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-rs-border bg-transparent text-muted-foreground hover:text-white"
                                  onClick={handleToggleStatus}
                                  disabled={updateMutation.isPending}
                                >
                                  Close pull request
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                            <AlertCircle className="size-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white">This branch has conflicts that must be resolved</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Conflicts found in: <span className="font-mono text-red-400">{pr.conflicts?.join(', ')}</span>
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button disabled variant="outline" size="sm" className="h-8 opacity-50 cursor-not-allowed">
                                Merge pull request
                              </Button>
                              {(isAuthor || isRepoOwner) && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-rs-border bg-transparent text-muted-foreground hover:text-white"
                                  onClick={handleToggleStatus}
                                  disabled={updateMutation.isPending}
                                >
                                  Close pull request
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-3 italic">
                              Resolve these conflicts locally using the CLI before merging.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="bg-red-600 p-1.5 rounded-full mt-0.5">
                        <GitPullRequest className="size-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">Pull request was closed without merging</h3>
                        <p className="text-xs text-muted-foreground mt-1">This pull request was closed. You can reopen it if needed.</p>
                        {(isAuthor || isRepoOwner) && (
                          <div className="mt-4">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="h-8 border-rs-border bg-transparent text-green-500 hover:bg-green-500/10"
                              onClick={handleToggleStatus}
                              disabled={updateMutation.isPending}
                            >
                              Reopen pull request
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment Section (Placeholder) */}
              <div className="flex flex-col gap-3">
                <div className="rounded-md border border-rs-border bg-rs-surface/30 p-8 text-center">
                  <MessageSquare className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">Comments coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="mb-2 font-semibold text-foreground flex items-center justify-between">
              Reviewers
            </h3>
            <p className="text-muted-foreground text-xs italic">No reviewers assigned</p>
          </section>

          <Separator className="bg-rs-border/40" />

          <section>
            <h3 className="mb-2 font-semibold text-foreground flex items-center justify-between">
              Labels
            </h3>
            <p className="text-muted-foreground text-xs italic">None yet</p>
          </section>
          
          <Separator className="bg-rs-border/40" />

          <section>
            <h3 className="mb-2 font-semibold text-foreground">Development</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <History className="size-3" />
                <span>Successfully linked to 1 branch</span>
              </div>
            </div>
          </section>

          {isRepoOwner && (
            <>
              <Separator className="bg-rs-border/40" />
              <section>
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 h-8 px-2 text-xs">
                  <Trash2 className="size-3.5" />
                  Delete pull request
                </Button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
