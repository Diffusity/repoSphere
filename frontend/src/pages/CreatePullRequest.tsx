import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, GitPullRequest, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRepository, useBranches, useCreatePullRequest } from '@/hooks/useRepository'

export function CreatePullRequest() {
  const { username = '', repoName = '' } = useParams()
  const navigate = useNavigate()

  const { data: repoRes } = useRepository(username, repoName)
  const { data: branchesRes, isLoading: branchesLoading } = useBranches(username, repoName)
  const createMutation = useCreatePullRequest()

  const repo = repoRes?.success ? repoRes.data : null
  const branches = branchesRes?.success ? branchesRes.data : []

  const [baseBranch, setBaseBranch] = useState(repo?.defaultBranch || 'master')
  const [compareBranch, setCompareBranch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const isValid = baseBranch && compareBranch && baseBranch !== compareBranch && title.trim().length > 0

  const handleCreate = () => {
    if (!isValid) return
    createMutation.mutate(
      { owner: username, name: repoName, payload: { title, description, base_branch: baseBranch, compare_branch: compareBranch } },
      {
        onSuccess: (res) => {
          if (res.success) {
            navigate(`/${username}/${repoName}/pulls/${res.data.number}`)
          }
        }
      }
    )
  }

  if (branchesLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="app-page max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to={`/${username}/${repoName}`} className="flex items-center gap-1 hover:text-rs-link">
          <ChevronLeft className="size-4" />
          Back to repository
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <GitPullRequest className="size-6 text-emerald-400" />
          Compare & pull request
        </h1>
        <p className="text-muted-foreground mt-2">
          Select branches to compare and create a pull request.
        </p>
      </div>

      <div className="surface-panel p-6 space-y-6">
        <div className="flex items-center gap-4 bg-rs-bg/35 p-4 rounded-lg border border-rs-border">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base</label>
            <select
              className="bg-rs-surface border border-rs-border rounded-md px-3 py-2 text-sm text-white outline-none focus:border-rs-link"
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
            >
              {branches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <ArrowRight className="size-5 text-muted-foreground mt-6" />
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compare</label>
            <select
              className="bg-rs-surface border border-rs-border rounded-md px-3 py-2 text-sm text-white outline-none focus:border-rs-link"
              value={compareBranch}
              onChange={(e) => setCompareBranch(e.target.value)}
            >
              <option value="" disabled>Select branch...</option>
              {branches.map(b => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {baseBranch === compareBranch && compareBranch !== '' && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            Please select a different branch to compare.
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-rs-border">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Title</label>
            <Input
              placeholder="e.g. Add new feature"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-rs-bg/35 border-rs-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description (optional)</label>
            <Textarea
              placeholder="Leave a comment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] bg-rs-bg/35 border-rs-border font-mono text-sm"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleCreate}
              disabled={!isValid || createMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Pull Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
