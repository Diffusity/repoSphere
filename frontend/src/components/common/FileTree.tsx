import { ChevronRight, File, Folder } from 'lucide-react'
import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { TreeEntry } from '@/types'

interface FileTreeProps {
  entries: TreeEntry[]
  className?: string
}

export function FileTree({ entries, className }: FileTreeProps) {
  const [fileModal, setFileModal] = React.useState<{ name: string; path: string } | null>(null)

  return (
    <div className={cn('text-sm', className)}>
      <ul className="space-y-0">
        {entries.map((e) => (
          <TreeNode key={e.name} entry={e} depth={0} path="" onFileOpen={setFileModal} />
        ))}
      </ul>
      <Dialog open={!!fileModal} onOpenChange={(o) => !o && setFileModal(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{fileModal?.path}</DialogTitle>
          </DialogHeader>
          <pre className="rounded-md border border-rs-border bg-rs-bg p-4 font-mono text-xs text-muted-foreground">
            {fileModal ? `Mock file content for ${fileModal.name}\n(hash: simulated)` : null}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function iconFor(name: string) {
  if (name.endsWith('.go')) return '🐹'
  if (name.endsWith('.md')) return '📝'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'TS'
  return null
}

function TreeNode({
  entry,
  depth,
  path,
  onFileOpen,
}: {
  entry: TreeEntry
  depth: number
  path: string
  onFileOpen: (v: { name: string; path: string }) => void
}) {
  const fullPath = path ? `${path}/${entry.name}` : entry.name
  const [open, setOpen] = React.useState(depth < 2)

  if (entry.type === 'file') {
    return (
      <li className="flex items-center" style={{ paddingLeft: depth * 12 }}>
        <button
          type="button"
          onClick={() => onFileOpen({ name: entry.name, path: fullPath })}
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-rs-elevated/80"
        >
          <File className="size-4 shrink-0 text-rs-link" />
          <span className="font-mono">{entry.name}</span>
          {iconFor(entry.name) ? (
            <span className="text-xs text-muted-foreground">{iconFor(entry.name)}</span>
          ) : null}
        </button>
      </li>
    )
  }

  return (
    <li style={{ paddingLeft: depth * 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left font-medium hover:bg-rs-elevated/80"
      >
        <ChevronRight className={cn('size-4 transition-transform', open && 'rotate-90')} />
        <Folder className="size-4 shrink-0 text-amber-500/90" />
        <span>{entry.name}</span>
      </button>
      {open && entry.children && (
        <ul className="mt-0.5 border-l border-rs-border/40 pl-1">
          {entry.children.map((c) => (
            <TreeNode key={c.name} entry={c} depth={depth + 1} path={fullPath} onFileOpen={onFileOpen} />
          ))}
        </ul>
      )}
    </li>
  )
}
