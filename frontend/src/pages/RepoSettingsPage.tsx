import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Loader2, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  Settings as SettingsIcon,
  Shield,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  useRepository, 
  useUpdateRepository, 
  useConfirmDeleteRepository 
} from '@/hooks/useRepository'
import { useAuthStore } from '@/stores/authStore'

export function RepoSettingsPage() {
  const { username = '', repoName = '' } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  
  // Fetch repository data
  const { data: repoRes, isLoading: repoLoading } = useRepository(username, repoName)
  const repo = repoRes?.success ? repoRes.data : null

  // Mutations
  const updateMutation = useUpdateRepository()
  const deleteMutation = useConfirmDeleteRepository()

  // State for forms
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [defaultBranch, setDefaultBranch] = useState('master')
  
  // State for deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  // Sync state when repo data is loaded
  useEffect(() => {
    if (repo) {
      setName(repo.name)
      setDescription(repo.description || '')
      setVisibility(repo.visibility)
      setDefaultBranch(repo.defaultBranch || 'master')
    }
  }, [repo])

  // Auth check
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

  const handleUpdate = async () => {
    try {
      const res = await updateMutation.mutateAsync({
        owner: username,
        name: repoName,
        payload: {
          name: name !== repo.name ? name : undefined,
          description,
          visibility,
          default_branch: defaultBranch
        }
      })
      
      if (res.success) {
        toast.success('Repository updated successfully')
        if (name !== repo.name) {
          navigate(`/${username}/${name}/settings`, { replace: true })
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update repository')
    }
  }

  const handleDelete = async () => {
    if (confirmName !== repo.name) return
    
    try {
      const res = await deleteMutation.mutateAsync({
        owner: username,
        name: repoName,
        confirmationName: confirmName
      })
      
      if (res.success) {
        toast.success('Repository deleted successfully')
        navigate('/repositories')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete repository')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-12 lg:px-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to={`/${username}/${repoName}`} className="flex items-center gap-1 hover:text-rs-link">
          <ChevronLeft className="size-4" />
          Back to repository
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <SettingsIcon className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-white">Repository Settings</h1>
      </div>

      <div className="space-y-6">
        <Card className="border-rs-border bg-rs-surface shadow-sm">
          <CardHeader className="border-b border-rs-border/50">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-rs-link" />
              <CardTitle className="text-lg">General Settings</CardTitle>
            </div>
            <CardDescription>Manage your repository's basic information.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input 
                    id="repo-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black/20 border-rs-border focus:ring-rs-link"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-branch">Default Branch</Label>
                  <Input 
                    id="default-branch" 
                    value={defaultBranch} 
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="bg-black/20 border-rs-border focus:ring-rs-link"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="repo-desc">Description</Label>
                  <Input 
                    id="repo-desc" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of your project"
                    className="bg-black/20 border-rs-border focus:ring-rs-link"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Visibility</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-rs-border bg-black/20 px-4 py-3 hover:bg-black/30 transition-colors">
                    <input 
                      type="radio" 
                      name="visibility" 
                      checked={visibility === 'public'} 
                      onChange={() => setVisibility('public')}
                      className="size-4 text-rs-link"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Public</p>
                      <p className="text-xs text-muted-foreground">Anyone on the internet can see this repository.</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-rs-border bg-black/20 px-4 py-3 hover:bg-black/30 transition-colors">
                    <input 
                      type="radio" 
                      name="visibility" 
                      checked={visibility === 'private'} 
                      onChange={() => setVisibility('private')}
                      className="size-4 text-rs-link"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Private</p>
                      <p className="text-xs text-muted-foreground">Only you can see this repository.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end border-t border-rs-border pt-6">
                <Button 
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-rs-link hover:bg-rs-link/90 text-white"
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-900/30 bg-rs-surface shadow-sm">
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
                className="border-rs-border hover:bg-rs-elevated"
                onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
              >
                Change to {visibility === 'public' ? 'private' : 'public'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div>
                <p className="font-semibold text-white">Delete this repository</p>
                <p className="text-sm text-muted-foreground">Once you delete a repository, there is no going back. Please be certain.</p>
              </div>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
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
            <DialogDescription className="text-muted-foreground pt-2">
              This action <strong>cannot</strong> be undone. This will permanently delete the 
              <span className="text-white font-semibold"> {username}/{repoName} </span> 
              repository and all associated commits, branches, and files.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-red-950/20 p-3 border border-red-900/30">
              <p className="text-xs text-red-400">
                Type <span className="font-mono font-bold select-all">{repoName}</span> to confirm deletion.
              </p>
            </div>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmName === repoName && !deleteMutation.isPending) {
                  handleDelete()
                }
              }}
              placeholder="Enter repository name"
              className="bg-black/20 border-rs-border focus:ring-red-500"
            />
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-rs-border"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
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
