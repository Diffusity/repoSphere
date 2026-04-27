import { Code2, GitBranch, Globe2, ShieldCheck, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/hero.png'
import { TerminalBlock } from '@/components/common/TerminalBlock'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

const features = [
  {
    title: 'CLI-first',
    description: 'Work locally with rs commands, then push the repository context to the web.',
    icon: Terminal,
  },
  {
    title: 'Web UI',
    description: 'Browse trees, read files, and inspect commit history from a clean workspace.',
    icon: Globe2,
  },
  {
    title: 'Secure auth',
    description: 'Cookie-based web auth and terminal handoff keep browser and CLI sessions separate.',
    icon: ShieldCheck,
  },
  {
    title: 'Open protocol',
    description: 'REST APIs are shaped for automation and repository workflows.',
    icon: GitBranch,
  },
]

export function LandingPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-rs-bg">
      <nav className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-rs-border bg-rs-surface text-rs-accent">
            <GitBranch className="size-4" />
          </span>
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

      <section className="relative isolate overflow-hidden border-b border-rs-border px-4 pb-12 pt-28 md:px-8 md:pb-16 md:pt-32">
        <div className="subtle-grid pointer-events-none absolute inset-0 opacity-70" />
        <img
          src={heroImage}
          alt=""
          className="pointer-events-none absolute right-[-3rem] top-20 z-[-1] w-[24rem] opacity-35 blur-[0.2px] sm:right-8 md:w-[30rem] lg:right-[10%] lg:opacity-55"
        />
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-rs-border bg-rs-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-rs-accent" />
              Browser and terminal, one workspace
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              RepoSphere
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              A focused version-control workspace for local commits, repository browsing, and CLI authentication.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
                <Link to="/cli-demo">CLI handoff</Link>
              </Button>
            </div>
          </div>

          <TerminalBlock
            command={'commit -m "feat: initial"'}
            output={'Initialized empty RS repository in .rs/\n[master abc123f] feat: initial'}
            animate
            className="mt-10 max-w-2xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="page-heading mb-6">
          <h2 className="page-title">Built For Builders</h2>
          <p className="page-subtitle">A compact surface for the repository tasks you repeat every day.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="interactive-panel">
              <CardHeader>
                <span className="mb-2 inline-flex size-9 items-center justify-center rounded-md border border-rs-border bg-rs-bg text-rs-link">
                  <Icon className="size-4" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
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
        </div>
      </footer>
    </div>
  )
}
