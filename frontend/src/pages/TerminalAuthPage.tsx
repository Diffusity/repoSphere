import { useAuth, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Loader2, Terminal, CheckCircle2, AlertCircle } from 'lucide-react'
import * as React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { completeTerminalSession } from '@/api/auth'
import { useApiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TerminalAuthPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { isLoaded, isSignedIn } = useAuth()
  const apiClient = useApiClient()
  const navigate = useNavigate()

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  const handleAuth = React.useCallback(async () => {
    if (!token) {
      setStatus('error')
      setError('Missing session token in URL.')
      return
    }

    setStatus('loading')
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

  // Auto-trigger auth if signed in and landing on page
  React.useEffect(() => {
    if (isLoaded && isSignedIn && status === 'idle' && token) {
      void handleAuth()
    }
  }, [isLoaded, isSignedIn, status, token, handleAuth])

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rs-bg p-4">
        <Card className="w-full max-w-md border-rs-border bg-rs-surface">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <AlertCircle className="size-12 text-rs-danger" />
            </div>
            <CardTitle className="text-center">Invalid Request</CardTitle>
            <CardDescription className="text-center">
              No session token was provided. Please restart the login process from your terminal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-bg p-4">
      <Card className="w-full max-w-md border-rs-border bg-rs-surface">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-rs-link/10 p-3">
              <Terminal className="size-8 text-rs-link" />
            </div>
          </div>
          <CardTitle>Authorize rs CLI</CardTitle>
          <CardDescription>
            Link your terminal session to your RepoSphere account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <SignedOut>
            <div className="rounded-lg border border-rs-border bg-rs-bg p-4 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                You need to be signed in to authorize your terminal.
              </p>
              <SignInButton mode="modal">
                <Button className="w-full">Sign In to Continue</Button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {status === 'idle' || status === 'loading' ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="mb-4 size-10 animate-spin text-rs-link" />
                <p className="text-sm text-muted-foreground">Authorizing your session...</p>
              </div>
            ) : null}

            {status === 'success' ? (
              <div className="flex flex-col items-center space-y-4 py-6 text-center">
                <CheckCircle2 className="size-16 text-rs-accent" />
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Success!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your terminal session is now authorized. You can close this tab and return to your terminal.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.close()} className="mt-4">
                  Close Window
                </Button>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="flex flex-col items-center space-y-4 py-6 text-center">
                <AlertCircle className="size-16 text-rs-danger" />
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-rs-danger">Authorization Failed</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <div className="flex w-full gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => void handleAuth()}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : null}
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  )
}
