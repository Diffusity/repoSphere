import * as React from 'react'
import { FolderGit2, Plus, Search, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { useApiClient } from '@/api/client'
import { createRepository } from '@/api/repo'
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
    let list = repositories.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(q.toLowerCase()))
      const matchesLang = lang === 'all' || r.language === lang
      return matchesQ && matchesLang
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'stars') return b.stars - a.stars
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    return list
  }, [repositories, q, lang, sort])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground">Manage your code and collaborations.</p>
        </div>
        <NewRepoDialog />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-rs-border bg-rs-surface p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Find a repository…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white"
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Filter by language"
          >
            {languages.map((l) => (
              <option key={l} value={l} className="bg-[#111]">
                {l === 'all' ? 'All languages' : l}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort repositories"
          >
            <option value="updated" className="bg-[#111]">Last updated</option>
            <option value="stars" className="bg-[#111]">Stars</option>
            <option value="name" className="bg-[#111]">Name</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-lg border border-rs-border bg-rs-surface animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-rs-border bg-rs-surface">
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
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to create repository')
    }
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
          <DialogTitle>Create repository</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            A repository contains all your project's files and revision history.
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
              className="bg-black/50 border-rs-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-desc">Description (optional)</Label>
            <Input 
              id="repo-desc" 
              placeholder="Short description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/50 border-rs-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="private" 
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-rs-border bg-black/50" 
            />
            <Label htmlFor="private">Private</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending} className="border-rs-border">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || createMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
            {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
