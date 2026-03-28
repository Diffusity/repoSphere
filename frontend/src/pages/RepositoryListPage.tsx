import { FolderGit2, Plus, Search } from 'lucide-react'
import * as React from 'react'
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
import type { Repository } from '@/types'

export function RepositoryListPage() {
  const { repositories } = useRepositories()
  const [q, setQ] = React.useState('')
  const [lang, setLang] = React.useState<string | 'all'>('all')
  const [sort, setSort] = React.useState<'updated' | 'stars' | 'name'>('updated')

  const languages = React.useMemo(() => {
    const s = new Set(repositories.map((r) => r.language))
    return ['all', ...Array.from(s)]
  }, [repositories])

  const filtered = React.useMemo(() => {
    let list = repositories.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.description.toLowerCase().includes(q.toLowerCase())
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
          <p className="text-sm text-muted-foreground">All repos you can access (mock list).</p>
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
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Filter by language"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l === 'all' ? 'All languages' : l}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort repositories"
          >
            <option value="updated">Last updated</option>
            <option value="stars">Stars</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-rs-border">
          <CardHeader className="flex flex-col items-center py-16 text-center">
            <FolderGit2 className="mb-4 size-16 text-muted-foreground/40" />
            <CardTitle>No repositories found</CardTitle>
            <CardDescription>Try another search or create a new repository (UI only).</CardDescription>
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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New repository
        </Button>
      </DialogTrigger>
      <DialogContent className="border-rs-border bg-rs-surface">
        <DialogHeader>
          <DialogTitle>Create repository</DialogTitle>
          <DialogDescription>
            This dialog is a placeholder until the repository API exists. Names are not persisted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="repo-name">Name</Label>
            <Input id="repo-name" placeholder="my-repo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-desc">Description</Label>
            <Input id="repo-desc" placeholder="Short description" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="readme" defaultChecked className="rounded border-input" />
            <Label htmlFor="readme">Initialize with README</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="private" className="rounded border-input" />
            <Label htmlFor="private">Private</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Create (mock)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
