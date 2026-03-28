import * as React from 'react'
import { cn } from '@/lib/utils'

interface TerminalBlockProps {
  command: string
  output?: string
  prompt?: string
  animate?: boolean
  className?: string
}

export function TerminalBlock({
  command,
  output,
  prompt = '$',
  animate = false,
  className,
}: TerminalBlockProps) {
  const [shown, setShown] = React.useState(animate ? '' : command)

  React.useEffect(() => {
    if (!animate) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(command.slice(0, i))
      if (i >= command.length) window.clearInterval(id)
    }, 40)
    return () => window.clearInterval(id)
  }, [animate, command])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-rs-border bg-[#0c0c0c] text-left shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-500/90" />
        <span className="size-2.5 rounded-full bg-amber-400/90" />
        <span className="size-2.5 rounded-full bg-emerald-500/90" />
        <span className="ml-2 text-xs text-white/40">terminal</span>
      </div>
      <div className="p-4 font-mono text-sm leading-relaxed text-emerald-100/95">
        <div>
          <span className="text-white/40">{prompt}</span> rs {shown}
          {animate && shown.length < command.length ? (
            <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-emerald-400/80 align-middle" />
          ) : null}
        </div>
        {output ? <div className="mt-2 text-white/70">{output}</div> : null}
      </div>
    </div>
  )
}
