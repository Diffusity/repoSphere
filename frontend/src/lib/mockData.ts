import type { Commit, DiffFile, Repository, TreeEntry } from '@/types'

const demoTree: TreeEntry[] = [
  {
    name: 'src',
    type: 'directory',
    children: [
      {
        name: 'main.go',
        type: 'file',
        hash: 'a1b2c3d',
      },
      {
        name: 'auth',
        type: 'directory',
        children: [{ name: 'handler.go', type: 'file', hash: 'e4f5g6h' }],
      },
      { name: 'rs.go', type: 'file', hash: 'i7j8k9l' },
    ],
  },
  { name: 'README.md', type: 'file', hash: 'm0n1o2p' },
  { name: 'go.mod', type: 'file', hash: 'q3r4s5t' },
]

export const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'my-project',
    owner: 'john_doe',
    description: 'A sample project tracked with rs',
    visibility: 'public',
    stars: 12,
    forks: 3,
    language: 'TypeScript',
    updatedAt: '2026-03-25T07:06:00Z',
    defaultBranch: 'master',
    latestCommit: {
      hash: '9a1f5c152f7d58b7',
      message: 'feat: add authentication',
      author: 'john_doe',
      timestamp: '2026-03-25T07:06:00Z',
    },
  },
  {
    id: '2',
    name: 'reposphere-cli',
    owner: 'john_doe',
    description: 'The rs CLI — local VCS for RepoSphere',
    visibility: 'public',
    stars: 48,
    forks: 9,
    language: 'Go',
    updatedAt: '2026-03-24T14:22:00Z',
    defaultBranch: 'master',
    latestCommit: {
      hash: 'b2c3d4e5f6a70891',
      message: 'fix: diff output for empty trees',
      author: 'jane_dev',
      timestamp: '2026-03-24T14:22:00Z',
    },
  },
  {
    id: '3',
    name: 'design-system',
    owner: 'acme',
    description: 'UI kit for internal tools',
    visibility: 'private',
    stars: 5,
    forks: 0,
    language: 'CSS',
    updatedAt: '2026-03-20T10:00:00Z',
    defaultBranch: 'master',
    latestCommit: {
      hash: 'c0ffee123456789a',
      message: 'chore: tokens for dark mode',
      author: 'acme',
      timestamp: '2026-03-20T10:00:00Z',
    },
  },
]

export const mockCommitsByRepo: Record<string, Commit[]> = {
  'john_doe/my-project': [
    {
      hash: '9a1f5c152f7d58b7',
      message: 'feat: add authentication',
      author: 'john_doe',
      authorEmail: 'john@example.com',
      timestamp: '2026-03-25T07:06:00Z',
      parent: 'abc123def4567890',
      filesChanged: [
        { path: 'src/auth.go', status: 'added' },
        { path: 'README.md', status: 'modified' },
      ],
      tree: demoTree,
    },
    {
      hash: 'abc123def4567890',
      message: 'feat: initial commit',
      author: 'john_doe',
      authorEmail: 'john@example.com',
      timestamp: '2026-03-24T18:30:00Z',
      parent: '0000000000000000',
      filesChanged: [{ path: 'README.md', status: 'added' }],
      tree: [{ name: 'README.md', type: 'file' }],
    },
  ],
  'john_doe/reposphere-cli': [
    {
      hash: 'b2c3d4e5f6a70891',
      message: 'fix: diff output for empty trees',
      author: 'jane_dev',
      authorEmail: 'jane@example.com',
      timestamp: '2026-03-24T14:22:00Z',
      parent: 'deadbeefcafebabe',
      filesChanged: [{ path: 'cmd/root.go', status: 'modified' }],
    },
  ],
  'acme/design-system': [],
}

export const mockReadmeByRepo: Record<string, string> = {
  'john_doe/my-project': `# my-project

Tracked with **RepoSphere** (\`rs\`).

\`\`\`bash
rs init
rs add .
rs commit -m "feat: initial"
\`\`\`
`,
  'john_doe/reposphere-cli': `# reposphere-cli

The \`rs\` command-line interface.`,
}

export function getMockCommitsForRepo(owner: string, repoName: string): Commit[] {
  const key = `${owner}/${repoName}`
  return mockCommitsByRepo[key] ?? mockCommitsByRepo['john_doe/my-project'] ?? []
}

export function getMockRepo(owner: string, repoName: string): Repository | undefined {
  return mockRepositories.find((r) => r.owner === owner && r.name === repoName)
}

/** Resolve a commit by full or short hash, searching the repo bucket then all mock commits. */
export function findMockCommit(repoKey: string, hash: string): Commit | undefined {
  const match = (c: Commit) => c.hash === hash || (hash.length < c.hash.length && c.hash.startsWith(hash))
  const primary = mockCommitsByRepo[repoKey]
  if (primary) {
    const hit = primary.find(match)
    if (hit) return hit
  }
  for (const list of Object.values(mockCommitsByRepo)) {
    const hit = list.find(match)
    if (hit) return hit
  }
  return undefined
}

function diffForFile(path: string, status: 'added' | 'modified' | 'deleted'): DiffFile {
  if (status === 'added' && path === 'src/auth.go') {
    return {
      path,
      status: 'added',
      additions: 18,
      deletions: 0,
      hunks: [
        {
          oldStart: 0,
          newStart: 1,
          lines: [
            { type: '+', content: 'package main', newLineNumber: 1 },
            { type: '+', content: '', newLineNumber: 2 },
            { type: '+', content: 'import "fmt"', newLineNumber: 3 },
            { type: '+', content: '', newLineNumber: 4 },
            { type: '+', content: '// Session validates terminal JWTs for rs auth.', newLineNumber: 5 },
            { type: '+', content: 'type Session struct {', newLineNumber: 6 },
            { type: '+', content: '\tUserID string', newLineNumber: 7 },
            { type: '+', content: '\tToken  string', newLineNumber: 8 },
            { type: '+', content: '}', newLineNumber: 9 },
            { type: '+', content: '', newLineNumber: 10 },
            { type: '+', content: 'func NewSession(userID string) *Session {', newLineNumber: 11 },
            { type: '+', content: '\treturn &Session{UserID: userID}', newLineNumber: 12 },
            { type: '+', content: '}', newLineNumber: 13 },
            { type: '+', content: '', newLineNumber: 14 },
            { type: '+', content: 'func (s *Session) String() string {', newLineNumber: 15 },
            { type: '+', content: '\treturn fmt.Sprintf("session(%s)", s.UserID)', newLineNumber: 16 },
            { type: '+', content: '}', newLineNumber: 17 },
          ],
        },
      ],
    }
  }

  if (status === 'added') {
    return {
      path,
      status: 'added',
      additions: 3,
      deletions: 0,
      hunks: [
        {
          oldStart: 0,
          newStart: 1,
          lines: [
            { type: '+', content: '# ' + path, newLineNumber: 1 },
            { type: '+', content: '', newLineNumber: 2 },
            { type: '+', content: 'Initial content.', newLineNumber: 3 },
          ],
        },
      ],
    }
  }

  if (status === 'deleted') {
    return {
      path,
      status: 'deleted',
      additions: 0,
      deletions: 2,
      hunks: [
        {
          oldStart: 1,
          newStart: 0,
          lines: [
            { type: '-', content: 'legacy line 1', oldLineNumber: 1 },
            { type: '-', content: 'legacy line 2', oldLineNumber: 2 },
          ],
        },
      ],
    }
  }

  if (path === 'README.md') {
    return {
      path,
      status: 'modified',
      additions: 8,
      deletions: 3,
      hunks: [
        {
          oldStart: 1,
          newStart: 1,
          lines: [
            { type: ' ', content: '# RepoSphere Demo', oldLineNumber: 1, newLineNumber: 1 },
            { type: ' ', content: '', oldLineNumber: 2, newLineNumber: 2 },
            { type: '-', content: 'Old banner text.', oldLineNumber: 3 },
            { type: '+', content: 'Track your tree with **RepoSphere** (`rs`).', newLineNumber: 3 },
            { type: '+', content: '', newLineNumber: 4 },
            { type: '+', content: '## Quick start', newLineNumber: 5 },
            { type: '+', content: '', newLineNumber: 6 },
            { type: '+', content: '```bash', newLineNumber: 7 },
            { type: '+', content: 'rs init && rs add . && rs commit -m "init"', newLineNumber: 8 },
            { type: '+', content: '```', newLineNumber: 9 },
          ],
        },
      ],
    }
  }

  if (path === 'cmd/root.go') {
    return {
      path,
      status: 'modified',
      additions: 4,
      deletions: 2,
      hunks: [
        {
          oldStart: 12,
          newStart: 12,
          lines: [
            { type: ' ', content: '\tdiffCmd.Flags().Bool("unified", true, "unified diff output")', oldLineNumber: 12, newLineNumber: 12 },
            { type: '-', content: '\treturn rootCmd.Execute()', oldLineNumber: 13 },
            { type: '+', content: '\tif err := rootCmd.Execute(); err != nil {', newLineNumber: 13 },
            { type: '+', content: '\t\tfmt.Fprintln(os.Stderr, err)', newLineNumber: 14 },
            { type: '+', content: '\t\tos.Exit(1)', newLineNumber: 15 },
            { type: '+', content: '\t}', newLineNumber: 16 },
          ],
        },
      ],
    }
  }

  return {
    path,
    status: 'modified',
    additions: 2,
    deletions: 1,
    hunks: [
      {
        oldStart: 1,
        newStart: 1,
        lines: [
          { type: ' ', content: '// ' + path, oldLineNumber: 1, newLineNumber: 1 },
          { type: '-', content: 'old behaviour', oldLineNumber: 2 },
          { type: '+', content: 'new behaviour', newLineNumber: 2 },
        ],
      },
    ],
  }
}

export function mockDiffForCommit(repoKey: string, hash: string): DiffFile[] {
  const c = findMockCommit(repoKey, hash)
  if (!c) {
    return [
      {
        path: 'unknown',
        status: 'modified',
        additions: 0,
        deletions: 0,
        hunks: [],
      },
    ]
  }

  return c.filesChanged.map((f) => diffForFile(f.path, f.status))
}
