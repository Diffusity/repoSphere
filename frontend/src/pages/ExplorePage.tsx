import * as React from 'react'
import { RepoCard } from '@/components/common/RepoCard'
import { Input } from '@/components/ui/input'
import { mockRepositories } from '@/lib/mockData'

const languages = ['All', 'TypeScript', 'Go', 'CSS']

export function ExplorePage() {
  const [q, setQ] = React.useState('')
  const [pill, setPill] = React.useState('All')

  const publicRepos = mockRepositories.filter((r) => r.visibility === 'public')
  const trending = [...publicRepos].sort((a, b) => b.stars - a.stars).slice(0, 3)

  const filtered = publicRepos.filter((r) => {
    const matchesLang = pill === 'All' || r.language === pill
    const matchesQ =
      !q ||
      `${r.owner}/${r.name}`.toLowerCase().includes(q.toLowerCase()) ||
      r.description.toLowerCase().includes(q.toLowerCase())
    return matchesLang && matchesQ
  })

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="mt-2 text-muted-foreground">Discover public repositories (mock data).</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Featured</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {trending.map((r) => (
            <RepoCard key={r.id} repo={r} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Search</h2>
        <Input
          placeholder="Search public repositories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xl bg-rs-surface"
        />
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setPill(l)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                pill === l
                  ? 'border-rs-link bg-rs-elevated text-rs-link'
                  : 'border-rs-border text-muted-foreground hover:border-rs-link/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => (
            <RepoCard key={`s-${r.id}`} repo={r} />
          ))}
        </div>
      </section>
    </div>
  )
}
