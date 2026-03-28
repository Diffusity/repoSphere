import { ClipboardCheck, Copy } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn, truncateHash } from '@/lib/utils'

interface CommitHashProps {
  hash: string
  className?: string
}

export function CommitHash({ hash, className }: CommitHashProps) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn('inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      title="Copy full hash"
    >
      <Badge variant="outline" className="cursor-pointer font-mono text-xs text-rs-link">
        {truncateHash(hash)}
      </Badge>
      {copied ? (
        <ClipboardCheck className="size-3.5 text-rs-accent" aria-hidden />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" aria-hidden />
      )}
    </button>
  )
}
