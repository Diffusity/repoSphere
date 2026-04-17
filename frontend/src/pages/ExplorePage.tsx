import * as React from 'react'
import { Search } from 'lucide-react'
import { RepoCard } from '@/components/common/RepoCard'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { useApiClient } from '@/api/client'
import { fetchExploreRepositories } from '@/api/repo'

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
    queryFn: () => fetchExploreRepositories(client, {
      search: debouncedQ,
      language: pill === 'All' ? undefined : pill
    })
  })

  const repositories = exploreRes?.success ? exploreRes.data : []
  const trending = repositories.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 lg:px-0">
      <div>
        <h1 className="text-3xl font-bold text-white">Explore</h1>
        <p className="mt-2 text-muted-foreground">Discover interesting public repositories from across the network.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Featured</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
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
        <h2 className="text-lg font-semibold text-white">Search</h2>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search public repositories…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-rs-surface border-rs-border"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPill(l)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${pill === l
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-rs-border text-muted-foreground hover:border-rs-link/50'
                }`}
            >
              {l}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-rs-border rounded-lg bg-rs-surface">
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
