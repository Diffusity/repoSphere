import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, GitPullRequest, GitMerge, Loader2, AlertCircle, CheckCircle2, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePullRequestDetail, useMergePullRequest, useRepository } from '@/hooks/useRepository'
import { formatRelativeTime } from '@/lib/utils'

export function PullRequestDetail() {
  const { username = '', repoName = '', number = '' } = useParams()
  const prNumber = parseInt(number, 10)

  const { data: repoRes } = useRepository(username, repoName)
  const { data: prRes, isLoading } = usePullRequestDetail(username, repoName, prNumber)
  const mergeMutation = useMergePullRequest()

  const repo = repoRes?.success ? repoRes.data : null
  const pr = prRes?.success ? prRes.data : null

  if (isLoading || !repo) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pr) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        Pull request not found
      </div>
    )
  }

  const handleMerge = () => {
    if (!pr.isMergeable || pr.status !== 'open') return
    mergeMutation.mutate({ owner: username, name: repoName, number: prNumber })
  }

  return (
    <div className="app-page max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to={`/${username}/${repoName}`} className="flex items-center gap-1 hover:text-rs-link">
          <ChevronLeft className="size-4" />
          Back to repository
        </Link>
      </div>

      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {pr.title} <span className="text-muted-foreground font-normal">#{pr.number}</span>
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              {pr.status === 'open' && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 text-xs font-medium gap-1.5 flex items-center hover:bg-emerald-500/20">
                  <CircleDot className="size-3.5" />
                  Open
                </Badge>
              )}
              {pr.status === 'merged' && (
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2 py-0.5 text-xs font-medium gap-1.5 flex items-center hover:bg-purple-500/20">
                  <GitMerge className="size-3.5" />
                  Merged
                </Badge>
              )}
              {pr.status === 'closed' && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-2 py-0.5 text-xs font-medium gap-1.5 flex items-center hover:bg-red-500/20">
                  <CheckCircle2 className="size-3.5" />
                  Closed
                </Badge>
              )}
              <span>
                <span className="font-semibold text-white">{pr.authorUsername}</span> wants to merge into <Badge variant="outline" className="font-mono px-1 py-0 uppercase tracking-wider text-[10px] mx-1">{pr.baseBranch}</Badge> from <Badge variant="outline" className="font-mono px-1 py-0 uppercase tracking-wider text-[10px] mx-1">{pr.compareBranch}</Badge>
              </span>
              <span>· opened {formatRelativeTime(pr.createdAt)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <div className="surface-panel overflow-hidden">
            <div className="border-b border-rs-border bg-rs-bg/45 px-4 py-3 text-sm font-medium text-white flex items-center gap-2">
              <span className="font-semibold">{pr.authorUsername}</span>
              <span className="text-muted-foreground font-normal">commented</span>
            </div>
            <div className="p-4 text-sm text-gray-200 whitespace-pre-wrap">
              {pr.description || <span className="text-muted-foreground italic">No description provided.</span>}
            </div>
          </div>

          <div className="surface-panel overflow-hidden">
            {pr.status === 'merged' ? (
              <div className="p-6 flex items-start gap-4 bg-purple-500/5">
                <div className="bg-purple-500/20 p-2 rounded-full mt-1">
                  <GitMerge className="size-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pull request successfully merged and closed</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Merged in commit <Link to={`/${username}/${repoName}/commit/${pr.mergeCommitHash}`} className="font-mono text-rs-link hover:underline">{pr.mergeCommitHash?.slice(0, 7)}</Link>
                  </p>
                </div>
              </div>
            ) : pr.status === 'open' ? (
              <div className="p-6">
                {pr.isMergeable ? (
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500/20 p-2 rounded-full mt-1">
                      <CheckCircle2 className="size-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">This branch has no conflicts with the base branch</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Merging can be performed automatically.
                      </p>
                      <Button 
                        onClick={handleMerge}
                        disabled={mergeMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {mergeMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <GitMerge className="mr-2 size-4" />}
                        Merge pull request
                      </Button>
                      {mergeMutation.isError && (
                        <p className="text-red-400 text-sm mt-2">Error: {(mergeMutation.error as any).response?.data?.detail || mergeMutation.error.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 p-2 rounded-full mt-1">
                      <AlertCircle className="size-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">This branch has conflicts that must be resolved</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        The backend detected conflicts in the following files:
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground font-mono bg-rs-bg/50 p-3 rounded-md mb-4 border border-rs-border">
                        {pr.conflicts?.map((file) => (
                          <li key={file}>{file}</li>
                        ))}
                        {(!pr.conflicts || pr.conflicts.length === 0) && (
                          <li className="list-none italic text-muted-foreground/70">No common ancestor or already up to date.</li>
                        )}
                      </ul>
                      <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
                        Merge pull request
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        Use the CLI to resolve conflicts locally: <code className="bg-rs-bg px-1 py-0.5 rounded">rs checkout {pr.baseBranch}</code> then <code className="bg-rs-bg px-1 py-0.5 rounded">rs merge {pr.compareBranch}</code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 flex items-start gap-4 bg-red-500/5">
                <div className="bg-red-500/20 p-2 rounded-full mt-1">
                  <CheckCircle2 className="size-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pull request was closed without merging</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
