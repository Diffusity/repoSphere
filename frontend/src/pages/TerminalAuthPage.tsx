import { CheckCircle2, Copy, Loader2, Terminal, XCircle } from 'lucide-react'
import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completeTerminalSession } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { AuthActionButton, AuthAlert, AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { savePostLoginRedirect } from '@/lib/authRedirect'
import { useAuthStore } from '@/stores/authStore'

export function TerminalAuthPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const isLoaded = useAuthStore((s) => s.isLoaded)
  const isSignedIn = useAuthStore((s) => s.isSignedIn)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const apiClient = useApiClient()
  const navigate = useNavigate()

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const handleAuth = React.useCallback(async () => {
    if (!token) {
      setStatus('error')
      setError('Missing session token in URL.')
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const res = await completeTerminalSession(apiClient, token)
      if (res.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setError(res.message ?? 'Failed to authorize terminal session.')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }, [apiClient, token])

  React.useEffect(() => {
    if (isLoaded && isSignedIn && status === 'idle' && token) {
      void handleAuth()
    }
  }, [isLoaded, isSignedIn, status, token, handleAuth])

  const onGoogle = () => {
    const redirectTo = `/terminal${window.location.search}`
    savePostLoginRedirect(redirectTo)
    loginWithGoogle(redirectTo)
  }

  const copyLoginCommand = async () => {
    try {
      await navigator.clipboard.writeText('rs login')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AuthShell
      badge="CLI handoff"
      title="Authorize terminal session"
      description="Complete a one-time browser handoff for your RepoSphere CLI login."
      backHref="/"
      backLabel="Back to home"
      panelTitle="Browser and terminal, linked on purpose."
      panelDescription="RepoSphere uses a dedicated handoff screen for CLI auth so the one-time session stays explicit, auditable, and easy to retry when something goes wrong."
      headerSlot={
        token ? (
          <AuthAlert>
            This tab is authorizing a one-time terminal session. Keep your terminal open until the handoff completes.
          </AuthAlert>
        ) : (
          <AuthAlert>Open this page from the CLI after running rs login, or copy the command below.</AuthAlert>
        )
      }
    >
      {!token ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-rs-border bg-rs-bg/45 p-4 text-sm leading-6 text-slate-300">
            <div className="flex items-start gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
                <Terminal className="size-5" />
              </span>
              <div>
                <p className="font-medium text-white">Start from your terminal</p>
                <p className="mt-1.5">
                  Run <span className="font-mono text-slate-100">rs login</span> to generate a one-time browser
                  authorization link.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthActionButton type="button" onClick={copyLoginCommand}>
              <Copy className="size-4" />
              {copied ? 'Copied' : 'Copy command'}
            </AuthActionButton>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
              onClick={() => navigate('/sign-in')}
            >
              Sign in
            </Button>
          </div>
        </div>
      ) : !isLoaded ? (
        <div className="rounded-lg border border-rs-border bg-rs-bg/45 p-5 text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <p className="mt-3 text-lg font-medium text-white">Checking session...</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Please wait while we verify your account.</p>
        </div>
      ) : !isSignedIn ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-rs-border bg-rs-bg/45 p-4">
            <div className="flex items-start gap-4">
              <span className="inline-flex size-11 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
                <Terminal className="size-5" />
              </span>
              <div className="space-y-2 text-sm leading-6 text-slate-300">
                <p className="font-medium text-white">Sign in required</p>
                <p>Sign in with your RepoSphere account, then terminal authorization will continue automatically.</p>
              </div>
            </div>
          </div>

          <AuthActionButton type="button" onClick={() => navigate(`/sign-in?redirect=${encodeURIComponent(`/terminal${window.location.search}`)}`)}>
            Sign in to continue
          </AuthActionButton>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
            onClick={onGoogle}
          >
            Continue with Google
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {(status === 'idle' || status === 'loading') && (
            <div className="rounded-lg border border-rs-border bg-rs-bg/45 p-5 text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
                <Loader2 className="size-6 animate-spin" />
              </div>
              <p className="mt-3 text-lg font-medium text-white">Authorizing your terminal...</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Keep this tab open while we validate the one-time token.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                <CheckCircle2 className="size-7" />
              </div>
              <p className="mt-3 text-lg font-medium text-white">Terminal session authorized</p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/80">You can close this tab and return to your terminal.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-5 text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-lg border border-rose-300/20 bg-rose-400/10 text-rose-200">
                <XCircle className="size-7" />
              </div>
              <p className="mt-3 text-lg font-medium text-white">Authorization failed</p>
              <p className="mt-2 text-sm leading-6 text-rose-100/80">{error}</p>
            </div>
          )}

          {status === 'success' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthActionButton type="button" onClick={() => window.close()}>
                Close window
              </AuthActionButton>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-md border-rs-border bg-rs-bg/45 text-slate-100 hover:bg-rs-elevated"
                onClick={() => navigate('/dashboard')}
              >
                Open dashboard
              </Button>
            </div>
          ) : null}

          {status === 'error' ? (
            <AuthActionButton type="button" onClick={() => void handleAuth()}>
              Try again
            </AuthActionButton>
          ) : null}
        </div>
      )}
    </AuthShell>
  )
}
