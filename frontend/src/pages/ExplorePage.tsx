import * as React from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { fetchExploreRepositories } from '@/api/repo'
import { RepoCard } from '@/components/common/RepoCard'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const languages = ['All', 'TypeScript', 'Go', 'Python', 'CSS']

export function ExplorePage() {
  const [q, setQ] = React.useState('')
  const [debouncedQ, setDebouncedQ] = React.useState('')
  const [pill, setPill] = React.useState('All')

  const client = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500)
    return () => clearTimeout(timer)
  }, [q])

  const { data: exploreRes, isLoading } = useQuery({
    queryKey: ['explore', debouncedQ, pill],
    queryFn: () =>
      fetchExploreRepositories(client, {
        search: debouncedQ,
        language: pill === 'All' ? undefined : pill,
      }),
  })

  const repositories = exploreRes?.success ? exploreRes.data : []
  const trending = repositories.slice(0, 3)

  return (
    <div className="app-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="page-heading">
          <h1 className="page-title">Explore</h1>
          <p className="page-subtitle">Discover public repositories from across the network.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-md border border-rs-border bg-rs-surface/80 px-3 py-2 text-sm text-muted-foreground sm:flex">
          <Sparkles className="size-4 text-rs-warm" />
          Featured repositories
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">Featured</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {trending.map((r) => (
              <RepoCard key={r.id} repo={r} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="surface-panel flex flex-col gap-4 p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search public repositories..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPill(l)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                  pill === l
                    ? 'border-rs-link bg-rs-link/10 text-rs-link'
                    : 'border-rs-border text-muted-foreground hover:border-rs-link/50 hover:text-foreground'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rs-border bg-rs-surface py-12 text-center">
            <p className="text-muted-foreground">No matching repositories found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {repositories.map((r) => (
              <RepoCard key={r.id} repo={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
