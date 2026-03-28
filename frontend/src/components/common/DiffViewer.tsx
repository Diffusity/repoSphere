import { ChevronDown, ChevronRight, Columns2, Rows3 } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DiffFile, DiffHunk, DiffLine } from '@/types'

interface DiffViewerProps {
  files: DiffFile[]
  className?: string
  /** Smaller padding and no view toggle — for inline previews. */
  variant?: 'default' | 'compact'
}

type ViewMode = 'unified' | 'split'

function hunkStats(lines: DiffLine[]) {
  let oldCount = 0
  let newCount = 0
  for (const l of lines) {
    if (l.type === ' ' || l.type === '-') oldCount++
    if (l.type === ' ' || l.type === '+') newCount++
  }
  return { oldCount, newCount }
}

function statusBadge(status: DiffFile['status']) {
  switch (status) {
    case 'added':
      return <Badge className="bg-rs-accent/20 text-rs-accent hover:bg-rs-accent/30">Added</Badge>
    case 'deleted':
      return <Badge className="bg-rs-danger/20 text-rs-danger hover:bg-rs-danger/30">Deleted</Badge>
    default:
      return <Badge variant="secondary">Modified</Badge>
  }
}

export function DiffViewer({ files, className, variant = 'default' }: DiffViewerProps) {
  const [view, setView] = React.useState<ViewMode>('unified')
  const compact = variant === 'compact'
  const effectiveView = compact ? 'unified' : view

  return (
    <div className={cn('space-y-3', className)}>
      {!compact && files.some((f) => f.hunks.length > 0) ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Diff view</span>
          <div className="flex rounded-md border border-rs-border p-0.5">
            <Button
              type="button"
              variant={view === 'unified' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setView('unified')}
            >
              <Rows3 className="size-3.5" />
              Unified
            </Button>
            <Button
              type="button"
              variant={view === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setView('split')}
            >
              <Columns2 className="size-3.5" />
              Split
            </Button>
          </div>
        </div>
      ) : null}

      {files.map((file) => (
        <DiffFileBlock key={file.path} file={file} view={effectiveView} compact={compact} />
      ))}
    </div>
  )
}

function DiffFileBlock({
  file,
  view,
  compact,
}: {
  file: DiffFile
  view: ViewMode
  compact: boolean
}) {
  const [open, setOpen] = React.useState(true)
  const pad = compact ? 'px-2 py-1.5' : 'px-3 py-2'
  const textSize = compact ? 'text-xs leading-4' : 'text-sm leading-5'

  return (
    <div className="overflow-hidden rounded-lg border border-rs-border bg-rs-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 border-b border-rs-border bg-rs-elevated/50 text-left',
          pad
        )}
      >
        {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{file.path}</span>
        {statusBadge(file.status)}
        <span className="hidden text-xs text-muted-foreground sm:inline">
          +{file.additions} −{file.deletions}
        </span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          {file.hunks.length === 0 ? (
            <div className={cn('text-muted-foreground', pad)}>No diff hunks (binary or empty)</div>
          ) : view === 'unified' ? (
            file.hunks.map((hunk, hi) => (
              <UnifiedHunk key={hi} hunk={hunk} textSize={textSize} compact={compact} />
            ))
          ) : (
            file.hunks.map((hunk, hi) => <SplitHunk key={hi} hunk={hunk} textSize={textSize} compact={compact} />)
          )}
        </div>
      )}
    </div>
  )
}

function UnifiedHunk({
  hunk,
  textSize,
  compact,
}: {
  hunk: DiffHunk
  textSize: string
  compact: boolean
}) {
  const { oldCount, newCount } = hunkStats(hunk.lines)
  const header =
    hunk.oldStart === 0 && oldCount === 0
      ? `@@ -0,0 +${hunk.newStart},${newCount} @@`
      : `@@ -${hunk.oldStart},${oldCount} +${hunk.newStart},${newCount} @@`

  return (
    <div className="border-b border-rs-border/50 last:border-b-0">
      <div
        className={cn(
          'border-b border-rs-border/40 bg-rs-bg/80 px-2 py-1 font-mono text-xs text-amber-200/90',
          compact && 'py-0.5'
        )}
      >
        {header}
      </div>
      <pre className={cn('m-0 font-mono', textSize)}>
        {hunk.lines.map((line, li) => (
          <DiffUnifiedLine key={li} line={line} compact={compact} />
        ))}
      </pre>
    </div>
  )
}

function DiffUnifiedLine({ line, compact }: { line: DiffLine; compact: boolean }) {
  const wNum = compact ? 'w-8' : 'w-10'
  return (
    <div
      className={cn(
        'flex min-h-[1.25rem]',
        line.type === '+' && 'bg-emerald-950/55 text-emerald-100',
        line.type === '-' && 'bg-red-950/45 text-red-100',
        line.type === ' ' && 'bg-transparent text-foreground/90'
      )}
    >
      <span
        className={cn(
          wNum,
          'shrink-0 select-none border-r border-rs-border/50 px-1 text-right text-[10px] text-muted-foreground md:text-xs'
        )}
      >
        {line.oldLineNumber ?? ''}
      </span>
      <span
        className={cn(
          wNum,
          'shrink-0 select-none border-r border-rs-border/50 px-1 text-right text-[10px] text-muted-foreground md:text-xs'
        )}
      >
        {line.newLineNumber ?? ''}
      </span>
      <span className="w-5 shrink-0 select-none px-0.5 text-center text-muted-foreground">{line.type}</span>
      <code className="flex-1 whitespace-pre-wrap px-2">{line.content}</code>
    </div>
  )
}

function SplitHunk({ hunk, textSize, compact }: { hunk: DiffHunk; textSize: string; compact: boolean }) {
  const { oldCount, newCount } = hunkStats(hunk.lines)
  const header =
    hunk.oldStart === 0 && oldCount === 0
      ? `@@ -0,0 +${hunk.newStart},${newCount} @@`
      : `@@ -${hunk.oldStart},${oldCount} +${hunk.newStart},${newCount} @@`
  const wNum = compact ? 'w-7' : 'w-9'

  return (
    <div className="border-b border-rs-border/50 last:border-b-0">
      <div
        className={cn(
          'border-b border-rs-border/40 bg-rs-bg/80 px-2 py-1 font-mono text-xs text-amber-200/90',
          compact && 'py-0.5'
        )}
      >
        {header}
      </div>
      <div className={cn('grid grid-cols-2 divide-x divide-rs-border', textSize)}>
        <div className="min-w-0 bg-rs-bg/30">
          <div className="border-b border-rs-border/40 bg-rs-elevated/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Before
          </div>
          {hunk.lines.map((line, li) => (
            <SplitCell key={`o-${li}`} line={line} side="old" wNum={wNum} />
          ))}
        </div>
        <div className="min-w-0 bg-rs-bg/30">
          <div className="border-b border-rs-border/40 bg-rs-elevated/40 px-2 py-1 text-[10px] font-medium text-muted-foreground">
            After
          </div>
          {hunk.lines.map((line, li) => (
            <SplitCell key={`n-${li}`} side="new" line={line} wNum={wNum} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SplitCell({
  line,
  side,
  wNum,
}: {
  line: DiffLine
  side: 'old' | 'new'
  wNum: string
}) {
  if (side === 'old') {
    if (line.type === '+') {
      return <div className="min-h-[1.25rem] bg-rs-bg/20" />
    }
    const bg = line.type === '-' ? 'bg-red-950/45 text-red-100' : 'text-foreground/90'
    return (
      <div className={cn('flex min-h-[1.25rem] font-mono', bg)}>
        <span
          className={cn(
            wNum,
            'shrink-0 select-none border-r border-rs-border/40 px-1 text-right text-[10px] text-muted-foreground'
          )}
        >
          {line.oldLineNumber ?? ''}
        </span>
        <code className="flex-1 whitespace-pre-wrap px-2">{line.content}</code>
      </div>
    )
  }

  if (line.type === '-') {
    return <div className="min-h-[1.25rem] bg-rs-bg/20" />
  }
  const bg = line.type === '+' ? 'bg-emerald-950/55 text-emerald-100' : 'text-foreground/90'
  return (
    <div className={cn('flex min-h-[1.25rem] font-mono', bg)}>
      <span
        className={cn(
          wNum,
          'shrink-0 select-none border-r border-rs-border/40 px-1 text-right text-[10px] text-muted-foreground'
        )}
      >
        {line.newLineNumber ?? ''}
      </span>
      <code className="flex-1 whitespace-pre-wrap px-2">{line.content}</code>
    </div>
  )
}
