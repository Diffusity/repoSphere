import * as React from 'react'
import { 
  ChevronDown, 
  FolderGit2, 
  Loader2, 
  Plus, 
  Search, 
  Star 
} from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRepositories, useStarredRepositories } from '@/hooks/useRepositories'
import { useAuthStore } from '@/stores/authStore'
import type { Repository } from '@/types'
import { cn } from '@/lib/utils'

export function RepositoryListPage() {
  const username = useAuthStore((s) => s.user?.username ?? '')
  const { repositories, isLoading } = useRepositories(username)
  const { repositories: starredRepos, isLoading: isLoadingStarred } = useStarredRepositories(username)
  const [q, setQ] = React.useState('')
  const [lang, setLang] = React.useState<string | 'all'>('all')
  const [sort, setSort] = React.useState<'updated' | 'stars' | 'name'>('updated')

  const languages = React.useMemo(() => {
    const s = new Set([...repositories, ...starredRepos].map((r) => r.language).filter(Boolean))
    return ['all', ...Array.from(s)]
  }, [repositories, starredRepos])

  const filterList = (list: Repository[]) => {
    const filtered = list.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(q.toLowerCase()))
      const matchesLang = lang === 'all' || r.language === lang
      return matchesQ && matchesLang
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'stars') return b.stars - a.stars
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  const filteredRepos = React.useMemo(() => filterList(repositories), [repositories, q, lang, sort])
  const filteredStarred = React.useMemo(() => filterList(starredRepos), [starredRepos, q, lang, sort])

  const filterBar = (
    <div className="surface-panel flex flex-col gap-4 rounded-lg border border-rs-border bg-rs-surface/40 p-3.5 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Find a repository…"
          className="h-10 border-rs-border/50 bg-rs-bg/20 pl-10 transition-all focus:border-rs-link/50 focus:ring-1 focus:ring-rs-link/20"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex h-9 items-center gap-2 border-rs-border/50 bg-rs-bg/35 px-3 text-xs font-medium hover:bg-rs-bg/50 focus:border-rs-link/50"
            >
              <span className="text-muted-foreground/70">Language:</span>
              <span className="text-foreground">{lang === 'all' ? 'All' : lang}</span>
              <ChevronDown className="size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-rs-border bg-rs-surface p-1 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filter by language
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-rs-border" />
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {languages.map((l) => (
                <DropdownMenuItem
                  key={l}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                    l === lang && "bg-rs-accent/10 text-rs-link font-semibold"
                  )}
                  onSelect={() => setLang(l)}
                >
                  <span className="truncate">{l === 'all' ? 'All languages' : l}</span>
                  {l === lang && <div className="size-1.5 rounded-full bg-rs-link" />}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex h-9 items-center gap-2 border-rs-border/50 bg-rs-bg/35 px-3 text-xs font-medium hover:bg-rs-bg/50 focus:border-rs-link/50"
            >
              <span className="text-muted-foreground/70">Sort:</span>
              <span className="text-foreground">
                {sort === 'updated' ? 'Recently Updated' : sort === 'stars' ? 'Most Stars' : 'Alphabetical'}
              </span>
              <ChevronDown className="size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-rs-border bg-rs-surface p-1 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sort order
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-rs-border" />
            {[
              { value: 'updated', label: 'Recently Updated' },
              { value: 'stars', label: 'Most Stars' },
              { value: 'name', label: 'Alphabetical' }
            ].map((s) => (
              <DropdownMenuItem
                key={s.value}
                className={cn(
                  "flex items-center justify-between px-3 py-1.5 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                  s.value === sort && "bg-rs-accent/10 text-rs-link font-semibold"
                )}
                onSelect={() => setSort(s.value as any)}
              >
                <span className="truncate">{s.label}</span>
                {s.value === sort && <div className="size-1.5 rounded-full bg-rs-link" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="page-heading">
          <h1 className="page-title">Repositories</h1>
          <p className="page-subtitle">Manage your code and collaborations.</p>
        </div>
        <NewRepoDialog />
      </div>

      <Tabs defaultValue="repositories" className="w-full">
        <TabsList className="mb-4 h-auto w-full justify-start gap-6 border-b border-rs-border/60 bg-transparent p-0">
          <TabsTrigger 
            value="repositories" 
            className="group relative flex h-10 items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2 pt-1 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-rs-accent data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            <FolderGit2 className="size-4 opacity-70 group-hover:opacity-100" />
            Repositories
            <span className="ml-0.5 rounded-full bg-rs-elevated/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground group-data-[state=active]:bg-rs-accent/15 group-data-[state=active]:text-rs-accent">
              {isLoading ? '...' : repositories.length}
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="starred" 
            className="group relative flex h-10 items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2 pt-1 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-rs-accent data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            <Star className="size-4 opacity-70 group-hover:opacity-100" />
            Starred
            <span className="ml-0.5 rounded-full bg-rs-elevated/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground group-data-[state=active]:bg-rs-accent/15 group-data-[state=active]:text-rs-accent">
              {isLoadingStarred ? '...' : starredRepos.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="mt-0 space-y-6">
          {filterBar}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-lg border border-rs-border bg-rs-surface animate-pulse" />
              ))}
            </div>
          ) : filteredRepos.length === 0 ? (
            <Card className="border-dashed border-rs-border bg-rs-surface">
              <CardHeader className="flex flex-col items-center py-16 text-center">
                <FolderGit2 className="mb-4 size-16 text-muted-foreground/40" />
                <CardTitle>No repositories found</CardTitle>
                <CardDescription>Try another search or create a new repository.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRepos.map((r: Repository) => (
                <RepoCard key={r.id} repo={r} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="starred" className="mt-0 space-y-6">
          {filterBar}

          {isLoadingStarred ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-lg border border-rs-border bg-rs-surface animate-pulse" />
              ))}
            </div>
          ) : filteredStarred.length === 0 ? (
            <Card className="border-dashed border-rs-border bg-rs-surface">
              <CardHeader className="flex flex-col items-center py-16 text-center">
                <Star className="mb-4 size-16 text-muted-foreground/40" />
                <CardTitle>{q ? 'No matching stars' : 'No starred repositories'}</CardTitle>
                <CardDescription>
                  {q ? 'Try a different search query.' : "You haven't starred any repositories yet."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredStarred.map((r: Repository) => (
                <RepoCard key={r.id} repo={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
        <Button size="sm" className="gap-2 bg-rs-accent hover:bg-rs-accent/90">
          <Plus className="size-4" />
          New
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
          <Button onClick={handleCreate} disabled={!name || createMutation.isPending} className="bg-rs-accent hover:bg-rs-accent/90">
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
