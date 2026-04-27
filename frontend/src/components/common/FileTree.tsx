import { File, Folder } from 'lucide-react'
import { Link } from 'react-router-dom'
import { repoTreeUrl } from '@/lib/repoTree'
import { cn } from '@/lib/utils'
import type { TreeEntry } from '@/types'

export interface FileTreeLinkContext {
  username: string
  repoName: string
  branch: string
}

interface FileTreeProps {
  entries: TreeEntry[]
  className?: string
  linkContext: FileTreeLinkContext
  pathPrefix: string
}

function iconFor(name: string) {
  if (name.endsWith('.go')) return 'Go'
  if (name.endsWith('.md')) return 'MD'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'TS'
  return null
}

export function FileTree({ entries, className, linkContext, pathPrefix }: FileTreeProps) {
  const { username, repoName, branch } = linkContext
  const rowClass =
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-rs-elevated/80'

  return (
    <ul className={cn('text-sm', className)}>
      {entries.map((entry) => {
        const relativePath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name
        const href = repoTreeUrl(username, repoName, branch, relativePath)
        const isDir = entry.type === 'directory'

        return (
          <li key={entry.name}>
            <Link to={href} className={cn(rowClass, isDir && 'font-medium')}>
              {isDir ? (
                <Folder className="size-4 shrink-0 text-rs-link" aria-hidden />
              ) : (
                <File className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={cn('min-w-0 truncate', !isDir && 'font-mono')}>{entry.name}</span>
              {iconFor(entry.name) ? (
                <span className="ml-auto text-xs text-muted-foreground">{iconFor(entry.name)}</span>
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
