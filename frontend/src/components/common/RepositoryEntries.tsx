import { File, Folder } from 'lucide-react'
import { Link } from 'react-router-dom'
import { repoBlobUrl, repoTreeUrl } from '@/lib/repoTree'
import { cn } from '@/lib/utils'
import type { TreeEntry } from '@/types'

export interface RepositoryEntriesLinkContext {
  username: string
  repoName: string
  branch: string
}

interface RepositoryEntriesProps {
  entries: TreeEntry[]
  className?: string
  linkContext: RepositoryEntriesLinkContext
  pathPrefix: string
}

function iconFor(name: string) {
  if (name.endsWith('.go')) return 'Go'
  if (name.endsWith('.md')) return 'MD'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'TS'
  return null
}

export function RepositoryEntries({ entries, className, linkContext, pathPrefix }: RepositoryEntriesProps) {
  const { username, repoName, branch } = linkContext
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <ul className={cn('overflow-hidden rounded-md border border-rs-border text-sm', className)}>
      {sortedEntries.map((entry) => {
        const relativePath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name
        const isDir = entry.type === 'directory'
        const href = isDir
          ? repoTreeUrl(username, repoName, branch, relativePath)
          : repoBlobUrl(username, repoName, branch, relativePath)
        const trailingMeta = isDir ? 'Directory' : 'Updated recently'

        return (
          <li key={entry.name} className="border-b border-rs-border last:border-b-0">
            <Link
              to={href}
              className="grid min-h-11 grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-3 bg-rs-surface px-4 py-2.5 transition-colors hover:bg-[#1a2029]"
            >
              <div className="flex min-w-0 items-center gap-2">
                {isDir ? (
                  <Folder className="size-4 shrink-0 text-rs-link" aria-hidden />
                ) : (
                  <File className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className={cn('truncate', isDir ? 'font-medium text-rs-link' : 'font-mono text-foreground')}>
                  {entry.name}
                </span>
              </div>
              <span className="hidden min-w-0 truncate text-xs text-muted-foreground md:block">
                {isDir ? '-' : `Latest ${iconFor(entry.name) ?? 'file'} changes`}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {iconFor(entry.name) ?? trailingMeta}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
