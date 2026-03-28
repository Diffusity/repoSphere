import type { TreeEntry } from '@/types'

export type ResolvedTree =
  | { kind: 'dir'; entries: TreeEntry[]; pathPrefix: string }
  | { kind: 'file'; entry: TreeEntry; pathPrefix: string }
  | { kind: 'notFound' }

/** Build `/<username>/<repo>/tree/<branch>/…` with encoded path segments. */
function encodeRepoPath(relativePath: string) {
  const trimmed = relativePath.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return ''
  return trimmed.split('/').filter(Boolean).map(encodeURIComponent).join('/')
}

function repoObjectUrl(
  username: string,
  repoName: string,
  routeKind: 'tree' | 'blob',
  branch: string,
  relativePath: string
) {
  const u = encodeURIComponent(username)
  const r = encodeURIComponent(repoName)
  const b = encodeURIComponent(branch)
  const base = `/${u}/${r}/${routeKind}/${b}`
  const encoded = encodeRepoPath(relativePath)
  if (!encoded) return base
  return `${base}/${encoded}`
}

export function repoTreeUrl(username: string, repoName: string, branch: string, relativePath: string) {
  return repoObjectUrl(username, repoName, 'tree', branch, relativePath)
}

export function repoBlobUrl(username: string, repoName: string, branch: string, relativePath: string) {
  return repoObjectUrl(username, repoName, 'blob', branch, relativePath)
}

export function normalizeTreeSplat(splat: string | undefined): string {
  return (splat ?? '').replace(/^\/+|\/+$/g, '')
}

export function resolveTreePath(entries: TreeEntry[], pathFromUrl: string): ResolvedTree {
  const raw = pathFromUrl.replace(/^\/+|\/+$/g, '')
  if (!raw) return { kind: 'dir', entries, pathPrefix: '' }

  const segments = raw.split('/').filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s)
    } catch {
      return s
    }
  })

  let current: TreeEntry[] = entries
  let pathSoFar = ''

  for (let i = 0; i < segments.length; i++) {
    const name = segments[i]
    const found = current.find((e) => e.name === name)
    if (!found) return { kind: 'notFound' }
    pathSoFar = pathSoFar ? `${pathSoFar}/${name}` : name
    const isLast = i === segments.length - 1
    if (isLast) {
      if (found.type === 'file') return { kind: 'file', entry: found, pathPrefix: pathSoFar }
      return { kind: 'dir', entries: found.children ?? [], pathPrefix: pathSoFar }
    }
    if (found.type !== 'directory') return { kind: 'notFound' }
    current = found.children ?? []
  }
  return { kind: 'notFound' }
}
