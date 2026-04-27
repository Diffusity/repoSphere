import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateTerminalSession, useRevokeTerminalSession, useTerminalSessionPoll } from '@/hooks/useTerminalSession'
import { cn } from '@/lib/utils'

function CopyBlock({ text }: { text: string }) {
  const [done, setDone] = React.useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setDone(true)
    window.setTimeout(() => setDone(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group relative w-full rounded-lg border border-rs-border bg-rs-bg/70 px-4 py-3 text-left font-mono text-sm text-emerald-100 transition-colors hover:border-rs-link/50"
    >
      <code className="block break-all">{text}</code>
      <span className="mt-2 block text-xs text-muted-foreground">
        {done ? 'Copied!' : 'Click to copy'}
      </span>
    </button>
  )
}

export function CLIAuthBridge() {
  const create = useCreateTerminalSession()
  const revoke = useRevokeTerminalSession()
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const poll = useTerminalSessionPoll(sessionId)

  const valid = poll.data?.data?.valid
  const terminalJwt = poll.data?.data?.token ?? ''
  const active = valid === 'active'
  const revoked = valid === 'deleted'

  async function generate() {
    const data = await create.mutateAsync()
    setSessionId(data.sessionId)
    setToken(data.token)
  }

  async function revokeSession() {
    if (!sessionId) return
    await revoke.mutateAsync(sessionId)
  }

  const cmd = token ? `rs auth ${token}` : ''

  return (
    <div className="space-y-6">
      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>CLI token</CardTitle>
          <CardDescription>
            Link your terminal <kbd className="rounded bg-rs-elevated px-1 font-mono">rs</kbd> client to
            this account. Run the command in your shell after generating a one-time session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <Button onClick={() => void generate()} disabled={create.isPending}>
              {create.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate CLI token'
              )}
            </Button>
          ) : (
            <>
              {revoked ? (
                <div className="rounded-lg border border-rs-danger/30 bg-rs-danger/10 p-4 text-sm text-muted-foreground">
                  This CLI token has been revoked. Generate a new session to issue another one-time token.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Run in your terminal:</p>
                    <CopyBlock text={cmd} />
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-rs-border bg-rs-bg/70 p-4">
                    <span className="text-xs text-muted-foreground">Scan token</span>
                    <QRCodeSVG value={token ?? ''} size={128} level="M" fgColor="#f0f6fc" bgColor="#0d1117" />
                    <span className="max-w-[180px] break-all text-center font-mono text-[10px] text-muted-foreground">
                      {token}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Session status:</span>
                {poll.isFetching && !active && !revoked ? (
                  <Badge variant="outline" className="gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Waiting for CLI...
                  </Badge>
                ) : null}
                {active ? (
                  <Badge className="bg-rs-accent/25 text-rs-accent hover:bg-rs-accent/35">
                    CLI authenticated
                  </Badge>
                ) : null}
                {revoked ? (
                  <Badge variant="destructive">
                    Revoked
                  </Badge>
                ) : null}
                {!active && !revoked && !poll.isFetching && sessionId ? (
                  <span className="text-xs text-muted-foreground">
                    Polling every 2s until <code>rs auth</code> completes.
                  </span>
                ) : null}
              </div>

              {active && terminalJwt ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-rs-accent">Terminal JWT issued</p>
                  <pre
                    className={cn(
                      'max-h-40 overflow-auto break-all rounded-md border border-rs-border bg-rs-bg p-3 font-mono text-xs text-muted-foreground'
                    )}
                  >
                    {terminalJwt}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Use{' '}
                    <code className="rounded bg-rs-elevated px-1">Authorization: Terminal &lt;jwt&gt;</code> for
                    CLI API calls. Do not mix with web Bearer tokens in the same client.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {!revoked ? (
                  <Button variant="destructive" size="sm" onClick={() => void revokeSession()} disabled={revoke.isPending}>
                    {revoke.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      'Revoke token'
                    )}
                  </Button>
                ) : null}

                <Button variant="outline" size="sm" onClick={() => void generate()} disabled={create.isPending}>
                  New session
                </Button>
              </div>
            </>
          )}
          {create.isError ? (
            <p className="text-sm text-rs-danger">{(create.error as Error).message}</p>
          ) : null}
          {revoke.isError ? (
            <p className="text-sm text-rs-danger">{(revoke.error as Error).message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
