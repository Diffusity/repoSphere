import { Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TerminalBlock } from '@/components/common/TerminalBlock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

const features = [
  {
    title: 'CLI-first',
    description: 'Work locally with `rs`—init, add, commit, diff, and log—then push context to the web.',
  },
  {
    title: 'Web UI',
    description: 'Browse trees, readme, and history in a GitHub-inspired interface.',
  },
  {
    title: 'Secure auth',
    description: 'Cookie-based web auth with terminal JWT handoff for the CLI—never mixed in one header.',
  },
  {
    title: 'Open protocol',
    description: 'REST API designed for automation; repository APIs will land next.',
  },
]

export function LandingPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-rs-bg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="text-lg font-semibold">
          RepoSphere
        </Link>
        <div className="flex items-center gap-2">
          {!isSignedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/sign-up">Sign up</Link>
              </Button>
            </>
          ) : (
            <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </nav>

      <section className="relative overflow-hidden border-y border-rs-border bg-linear-to-b from-[#161b22] via-rs-bg to-rs-bg px-4 py-20 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Version Control, <span className="text-rs-link">Reimagined</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              RepoSphere pairs a native <code className="rounded bg-rs-elevated px-1 font-mono text-sm">rs</code> CLI
              with a modern web app—one model for local commits and collaborative browsing.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {!isSignedIn ? (
                <Button size="lg" asChild>
                  <Link to="/sign-up">Get started</Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link to="/explore">View demo</Link>
              </Button>
            </div>
          </div>
          <TerminalBlock
            command={'commit -m "feat: initial"'}
            output={'Initialized empty RS repository in .rs/\n[master abc123f] feat: initial'}
            animate
            className="shadow-2xl shadow-black/40"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="mb-8 text-2xl font-semibold">Built for builders</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-rs-border bg-rs-surface">
              <CardHeader>
                <CardTitle className="text-base">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-rs-border py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4">
          <a
            href="https://github.com"
            className="inline-flex items-center gap-1 text-rs-link hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 className="size-4" />
            GitHub
          </a>
          <Link to="/explore" className="text-rs-link hover:underline">
            Docs (soon)
          </Link>
        </div>
      </footer>
    </div>
  )
}
