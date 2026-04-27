import { ArrowLeft, GitBranch, Play, RotateCcw } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ── demo script ───────────────────────────────────────────── */

interface DemoStep {
  command: string
  output: string[]
  /** ms before next step starts after output finishes */
  pauseAfter?: number
}

const DEMO_STEPS: DemoStep[] = [
  {
    command: 'rs init my-project',
    output: [
      'Initialized empty RS repository in .rs/',
      'Default branch set to master',
    ],
    pauseAfter: 900,
  },
  {
    command: 'rs add .',
    output: ['Staging all files...', '3 files staged'],
    pauseAfter: 700,
  },
  {
    command: 'rs commit -m "feat: initial"',
    output: ['[master abc123f] feat: initial', '3 files changed, 42 insertions(+)'],
    pauseAfter: 900,
  },
  {
    command: 'rs push origin master',
    output: [
      'Enumerating objects: 5, done.',
      'Counting objects: 100% (5/5), done.',
      'Writing objects: 100% (5/5), 1.24 KiB | 1.24 MiB/s',
      'remote: Resolving deltas: 100% (2/2), done.',
      'To reposphere.dev:user/my-project',
      '   * [new branch]   master -> master',
    ],
    pauseAfter: 1100,
  },
  {
    command: 'rs log --oneline -3',
    output: [
      'abc123f (HEAD -> master) feat: initial',
      'def456a chore: add README',
      '789bcd0 ci: setup workflow',
    ],
    pauseAfter: 900,
  },
  {
    command: 'rs clone user/another-repo',
    output: [
      'Cloning into \'another-repo\'...',
      'remote: Counting objects: 28, done.',
      'Receiving objects: 100% (28/28), 6.52 KiB | 6.52 MiB/s, done.',
      'Resolving deltas: 100% (12/12), done.',
    ],
    pauseAfter: 600,
  },
  {
    command: 'rs status',
    output: [
      'On branch master',
      'nothing to commit, working tree clean',
    ],
  },
]

/* ── timing constants ──────────────────────────────────────── */

const CHAR_DELAY = 38 // ms per character when typing
const OUTPUT_LINE_DELAY = 120 // ms between output lines appearing
const INITIAL_DELAY = 600 // ms before demo starts

/* ── component ─────────────────────────────────────────────── */

interface RenderedLine {
  type: 'command' | 'output'
  text: string
  /** for command lines, how many chars are visible (typing effect) */
  visibleChars?: number
}

export function CLIDemoPage() {
  const [lines, setLines] = React.useState<RenderedLine[]>([])
  const [cursorVisible, setCursorVisible] = React.useState(true)
  const [isRunning, setIsRunning] = React.useState(true)
  const [isDone, setIsDone] = React.useState(false)
  const terminalRef = React.useRef<HTMLDivElement>(null)
  const runIdRef = React.useRef(0)

  /* blinking cursor */
  React.useEffect(() => {
    const id = window.setInterval(() => setCursorVisible((v) => !v), 530)
    return () => window.clearInterval(id)
  }, [])

  /* auto-scroll terminal to bottom */
  React.useEffect(() => {
    const el = terminalRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  /* ── animation orchestrator ────────────────────────────── */

  const runDemo = React.useCallback(async (runId?: number) => {
    const thisRun = runId ?? runIdRef.current + 1
    runIdRef.current = thisRun
    setLines([])
    setIsDone(false)
    setIsRunning(true)

    const wait = (ms: number) =>
      new Promise<void>((res) => {
        window.setTimeout(() => res(), ms)
      })

    const isStale = () => runIdRef.current !== thisRun

    await wait(INITIAL_DELAY)
    if (isStale()) return

    for (const step of DEMO_STEPS) {
      if (isStale()) return

      /* ① add a blank command line */
      const cmdLine: RenderedLine = { type: 'command', text: step.command, visibleChars: 0 }
      setLines((prev) => [...prev, cmdLine])

      /* ② type characters one at a time */
      for (let i = 1; i <= step.command.length; i++) {
        if (isStale()) return
        await wait(CHAR_DELAY)
        if (isStale()) return
        setLines((prev) => {
          const next = [...prev]
          const last = { ...next[next.length - 1] }
          last.visibleChars = i
          next[next.length - 1] = last
          return next
        })
      }

      /* ③ brief pause as if pressing Enter */
      await wait(260)
      if (isStale()) return

      /* ④ reveal output lines one by one */
      for (const outputLine of step.output) {
        if (isStale()) return
        setLines((prev) => [...prev, { type: 'output', text: outputLine }])
        await wait(OUTPUT_LINE_DELAY)
        if (isStale()) return
      }

      /* ⑤ pause before next command */
      if (step.pauseAfter) {
        await wait(step.pauseAfter)
        if (isStale()) return
      }
    }

    if (isStale()) return
    setIsRunning(false)
    setIsDone(true)
  }, [])

  /* auto-start on mount */
  React.useEffect(() => {
    const initialRunId = runIdRef.current + 1
    void runDemo(initialRunId)
    return () => {
      // Bump runId so any in-flight demo from this mount becomes stale
      runIdRef.current = initialRunId + 1
    }
  }, [runDemo])

  const handleReplay = () => {
    void runDemo()
  }

  /* ── render ────────────────────────────────────────────── */

  return (
    <div className="relative min-h-screen min-h-dvh overflow-hidden bg-rs-bg text-white">
      {/* background effects */}
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-rs-elevated/50 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-rs-accent/[0.04] blur-[120px]" />

      {/* top nav */}
      <nav className="relative z-20 mx-auto flex max-w-5xl items-center justify-between px-4 py-5 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold text-white">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-rs-border bg-rs-surface text-rs-accent">
            <GitBranch className="size-4" />
          </span>
          RepoSphere
        </Link>
      </nav>

      {/* hero copy */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 text-center md:px-8 md:pt-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-rs-accent/20 bg-rs-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rs-accent">
          <span className="size-1.5 rounded-full bg-rs-accent" />
          CLI Demo
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          See RepoSphere CLI in action
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400 md:text-base md:leading-7">
          Watch how a typical workflow unfolds — from initializing a repository to pushing your first commit, all from your terminal.
        </p>
      </div>

      {/* terminal window */}
      <div className="relative z-10 mx-auto mt-8 max-w-3xl px-4 md:mt-12 md:px-8">
        <div className="overflow-hidden rounded-xl border border-rs-border/80 bg-[#080d16] shadow-2xl shadow-black/50">
          {/* title bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500/90 transition hover:brightness-125" />
              <span className="size-3 rounded-full bg-amber-400/90 transition hover:brightness-125" />
              <span className="size-3 rounded-full bg-emerald-500/90 transition hover:brightness-125" />
              <span className="ml-3 text-xs font-medium text-white/40">rs terminal</span>
            </div>
            <div className="flex items-center gap-2">
              {isDone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 rounded-md px-2.5 text-[11px] text-white/50 hover:text-white"
                  onClick={handleReplay}
                >
                  <RotateCcw className="size-3" />
                  Replay
                </Button>
              )}
              {!isRunning && !isDone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 rounded-md px-2.5 text-[11px] text-white/50 hover:text-white"
                  onClick={() => void runDemo()}
                >
                  <Play className="size-3" />
                  Play
                </Button>
              )}
              {isRunning && (
                <span className="flex items-center gap-1.5 text-[11px] text-rs-accent/70">
                  <span className="size-1.5 animate-pulse rounded-full bg-rs-accent" />
                  Running
                </span>
              )}
            </div>
          </div>

          {/* terminal body */}
          <div
            ref={terminalRef}
            className="custom-scrollbar max-h-[420px] min-h-[320px] overflow-y-auto p-5 font-mono text-sm leading-[1.75] md:min-h-[380px] md:p-6"
          >
            {lines.map((line, idx) => {
              if (line.type === 'command') {
                const isCurrentlyTyping =
                  isRunning && idx === lines.length - 1 && (line.visibleChars ?? 0) < line.text.length
                const isLastCommand = idx === lines.length - 1

                return (
                  <div key={idx} className="mt-2 first:mt-0">
                    <span className="text-white/40">$ </span>
                    <span className="text-emerald-300/95">rs </span>
                    <span className="text-emerald-100/95">
                      {line.text.startsWith('rs ')
                        ? line.text.slice(3, line.visibleChars ?? line.text.length)
                        : line.text.slice(0, line.visibleChars ?? line.text.length)}
                    </span>
                    {(isCurrentlyTyping || (isLastCommand && isRunning && (line.visibleChars ?? 0) >= line.text.length)) && (
                      <span
                        className={cn(
                          'ml-0.5 inline-block h-4 w-[9px] translate-y-[2px] rounded-[1px] bg-emerald-400/80 align-middle',
                          cursorVisible ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    )}
                  </div>
                )
              }

              return (
                <div key={idx} className="animate-fadeIn text-white/55">
                  {line.text}
                </div>
              )
            })}

            {/* final cursor when done */}
            {isDone && (
              <div className="mt-2">
                <span className="text-white/40">$ </span>
                <span
                  className={cn(
                    'ml-0.5 inline-block h-4 w-[9px] translate-y-[2px] rounded-[1px] bg-emerald-400/80 align-middle',
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </div>
            )}

            {/* empty state */}
            {lines.length === 0 && isRunning && (
              <div className="flex items-center gap-2 text-white/30">
                <span className="text-white/40">$ </span>
                <span
                  className={cn(
                    'inline-block h-4 w-[9px] translate-y-[2px] rounded-[1px] bg-emerald-400/80',
                    cursorVisible ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* bottom caption */}
        <p className="mt-4 text-center text-xs text-slate-500">
          This is a simulated demo. Install the CLI to try it for real.
        </p>
      </div>

      {/* CTA below terminal */}
      <div className="relative z-10 mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-3 px-4 pb-16">
        <Button size="lg" asChild>
          <Link to="/sign-up">Get started</Link>
        </Button>

      </div>
    </div>
  )
}
