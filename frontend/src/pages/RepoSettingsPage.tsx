import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, Info, Loader2, Settings as SettingsIcon, Shield, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfirmDeleteRepository, useRepository, useUpdateRepository } from '@/hooks/useRepository'
import { useAuthStore } from '@/stores/authStore'
import type { Repository } from '@/types'

export function RepoSettingsPage() {
  const { username = '', repoName = '' } = useParams()
  const currentUser = useAuthStore((s) => s.user)
  const { data: repoRes, isLoading: repoLoading } = useRepository(username, repoName)
  const repo = repoRes?.success ? repoRes.data : null
  const isOwner = currentUser?.username === username

  if (repoLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-rs-link" />
      </div>
    )
  }

  if (!repo || !isOwner) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-semibold text-white">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to manage this repository.</p>
        <Button className="mt-6" asChild variant="outline">
          <Link to={`/${username}/${repoName}`}>Back to repository</Link>
        </Button>
      </div>
    )
  }

  return <RepoSettingsForm key={repo.id} repo={repo} username={username} repoName={repoName} />
}

function RepoSettingsForm({
  repo,
  username,
  repoName,
}: {
  repo: Repository
  username: string
  repoName: string
}) {
  const navigate = useNavigate()
  const updateMutation = useUpdateRepository()
  const deleteMutation = useConfirmDeleteRepository()

  const [name, setName] = useState(repo.name)
  const [description, setDescription] = useState(repo.description || '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(repo.visibility)
  const [defaultBranch, setDefaultBranch] = useState(repo.defaultBranch || 'master')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  const handleUpdate = async () => {
    try {
      const res = await updateMutation.mutateAsync({
        owner: username,
        name: repoName,
        payload: {
          name: name !== repo.name ? name : undefined,
          description,
          visibility,
          default_branch: defaultBranch,
        },
      })

      if (res.success) {
        toast.success('Repository updated successfully')
        if (name !== repo.name) {
          navigate(`/${username}/${name}/settings`, { replace: true })
        }
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update repository'))
    }
  }

  const handleDelete = async () => {
    if (confirmName !== repo.name) return

    try {
      const res = await deleteMutation.mutateAsync({
        owner: username,
        name: repoName,
        confirmationName: confirmName,
      })

      if (res.success) {
        toast.success('Repository deleted successfully')
        navigate('/repositories')
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete repository'))
    }
  }

  return (
    <div className="app-page max-w-4xl pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={`/${username}/${repoName}`} className="flex items-center gap-1 hover:text-rs-link">
          <ChevronLeft className="size-4" />
          Back to repository
        </Link>
      </div>

      <PageHeader
        badge="Repository controls"
        title="Repository settings"
        description={`Manage ${username}/${repoName}, update metadata, and handle high-impact repository actions.`}
        icon={SettingsIcon}
        meta={
          <>
            <span className="page-meta-pill">Default branch: {defaultBranch}</span>
            <span className="page-meta-pill">Visibility: {visibility}</span>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="surface-panel">
          <CardHeader className="border-b border-rs-border/50">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-rs-link" />
              <CardTitle className="text-lg">General Settings</CardTitle>
            </div>
            <CardDescription>Manage your repository's basic information.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleUpdate()
              }}
              className="space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input id="repo-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-branch">Default Branch</Label>
                  <Input id="default-branch" value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="repo-desc">Description</Label>
                  <Input
                    id="repo-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of your project"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Visibility</Label>
                <div className="flex flex-wrap gap-4">
                  <VisibilityOption
                    label="Public"
                    description="Anyone on the internet can see this repository."
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                  />
                  <VisibilityOption
                    label="Private"
                    description="Only you can see this repository."
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-rs-border pt-6">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-900/30 bg-rs-surface shadow-sm shadow-black/20">
          <CardHeader className="border-b border-red-900/20">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-red-500" />
              <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription>Actions that can have permanent consequences.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-rs-border">
            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div>
                <p className="font-semibold text-white">Change repository visibility</p>
                <p className="text-sm text-muted-foreground">This repository is currently {repo.visibility}.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
              >
                Change to {visibility === 'public' ? 'private' : 'public'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div>
                <p className="font-semibold text-white">Delete this repository</p>
                <p className="text-sm text-muted-foreground">Once you delete a repository, there is no going back.</p>
              </div>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 size-4" />
                Delete repository
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-rs-border bg-rs-surface text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="size-5" />
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription className="pt-2 text-muted-foreground">
              This action <strong>cannot</strong> be undone. This will permanently delete
              <span className="font-semibold text-white"> {username}/{repoName} </span>
              and its commits, branches, and files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-md border border-red-900/30 bg-red-950/20 p-3">
              <p className="text-xs text-red-400">
                Type <span className="select-all font-mono font-bold">{repoName}</span> to confirm deletion.
              </p>
            </div>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmName === repoName && !deleteMutation.isPending) {
                  void handleDelete()
                }
              }}
              placeholder="Enter repository name"
              className="focus:ring-red-500"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={confirmName !== repoName || deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              I understand, delete this repository
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VisibilityOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-rs-border bg-rs-bg/35 px-4 py-3 transition-colors hover:bg-rs-elevated/60">
      <input type="radio" name="visibility" checked={checked} onChange={onChange} className="size-4 text-rs-link" />
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  )
}

function getErrorMessage(err: unknown, fallback: string) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === 'string'
  ) {
    return (err as { response: { data: { detail: string } } }).response.data.detail
  }
  return fallback
}
