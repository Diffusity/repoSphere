import * as React from 'react'
import { FolderGit2, Loader2, Plus, Search } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useApiClient } from '@/api/client'
import { createRepository } from '@/api/repo'
import { RepoCard } from '@/components/common/RepoCard'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRepositories } from '@/hooks/useRepositories'
import { useAuthStore } from '@/stores/authStore'
import type { Repository } from '@/types'

export function RepositoryListPage() {
  const username = useAuthStore((s) => s.user?.username ?? '')
  const { repositories, isLoading } = useRepositories(username)
  const [q, setQ] = React.useState('')
  const [lang, setLang] = React.useState<string | 'all'>('all')
  const [sort, setSort] = React.useState<'updated' | 'stars' | 'name'>('updated')

  const languages = React.useMemo(() => {
    const s = new Set(repositories.map((r) => r.language).filter(Boolean))
    return ['all', ...Array.from(s)]
  }, [repositories])

  const filtered = React.useMemo(() => {
    const list = repositories.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(q.toLowerCase()))
      const matchesLang = lang === 'all' || r.language === lang
      return matchesQ && matchesLang
    })

    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'stars') return b.stars - a.stars
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [repositories, q, lang, sort])

  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-heading">
          <h1 className="page-title">Repositories</h1>
          <p className="page-subtitle">Manage your code and collaborations.</p>
        </div>
        <NewRepoDialog />
      </div>

      <div className="surface-panel flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Find a repository..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border border-input bg-rs-bg/35 px-3 text-sm text-white outline-none focus:border-rs-link"
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Filter by language"
          >
            {languages.map((l) => (
              <option key={l} value={l} className="bg-rs-surface">
                {l === 'all' ? 'All languages' : l}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-rs-bg/35 px-3 text-sm text-white outline-none focus:border-rs-link"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort repositories"
          >
            <option value="updated" className="bg-rs-surface">
              Last updated
            </option>
            <option value="stars" className="bg-rs-surface">
              Stars
            </option>
            <option value="name" className="bg-rs-surface">
              Name
            </option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-rs-border bg-rs-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-rs-border bg-rs-surface/70">
          <CardHeader className="flex flex-col items-center py-16 text-center">
            <FolderGit2 className="mb-4 size-16 text-muted-foreground/40" />
            <CardTitle>No repositories found</CardTitle>
            <CardDescription>Try another search or create a new repository.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r: Repository) => (
            <RepoCard key={r.id} repo={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function NewRepoDialog() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [isPrivate, setIsPrivate] = React.useState(false)

  const client = useApiClient()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => createRepository(client, formData),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message)
        queryClient.invalidateQueries({ queryKey: ['repositories'] })
        setOpen(false)
        setName('')
        setDescription('')
        setIsPrivate(false)
      }
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Failed to create repository'))
    },
  })

  const handleCreate = () => {
    if (!name) return
    const formData = new FormData()
    formData.append('name', name)
    if (description) formData.append('description', description)
    formData.append('visibility', isPrivate ? 'private' : 'public')
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New repository
        </Button>
      </DialogTrigger>
      <DialogContent className="border-rs-border bg-rs-surface text-white">
        <DialogHeader>
          <DialogTitle>Create Repository</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            A repository contains files and revision history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="repo-name">Name</Label>
            <Input
              id="repo-name"
              placeholder="my-repo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-desc">Description</Label>
            <Input
              id="repo-desc"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-rs-border bg-rs-bg/35 px-3 py-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="size-4 rounded border-rs-border bg-rs-bg"
            />
            <span className="text-sm">Private repository</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
