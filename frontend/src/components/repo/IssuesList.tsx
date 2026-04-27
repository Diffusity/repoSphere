import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CircleDot, CheckCircle2, MessageSquare, Plus, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, Tag } from 'lucide-react'
import { useIssues } from '@/hooks/useIssues'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LABELS = ['bug', 'enhancement', 'question', 'documentation', 'help wanted']

const LABEL_COLORS: Record<string, string> = {
  'bug': 'bg-red-500/10 text-red-500 border-red-500/20',
  'enhancement': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'question': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'documentation': 'bg-blue-300/10 text-blue-300 border-blue-300/20',
  'help wanted': 'bg-green-500/10 text-green-500 border-green-500/20',
}

export function IssuesList({ username, repoName }: { username: string; repoName: string }) {
  const currentUser = useAuthStore(s => s.user)
  
  const [status, setStatus] = useState<'open' | 'closed'>('open')
  const [label, setLabel] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: issuesRes, isLoading } = useIssues(username!, repoName!, status, label, page, limit)
  const { issues = [], openCount = 0, closedCount = 0, totalPages = 1 } = issuesRes?.success ? issuesRes.data : {}

  return (
    <div className="py-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', status === 'open' ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            onClick={() => { setStatus('open'); setPage(1) }}
          >
            <CircleDot className="size-4 text-green-500" />
            {openCount} Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', status === 'closed' ? 'font-semibold text-foreground' : 'text-muted-foreground')}
            onClick={() => { setStatus('closed'); setPage(1) }}
          >
            <CheckCircle2 className="size-4 text-purple-500" />
            {closedCount} Closed
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 border-rs-border bg-rs-surface h-9 px-3 text-sm font-medium hover:bg-[#212830] transition-colors"
              >
                <Tag className="size-3.5 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{label || 'Labels (All)'}</span>
                <ChevronDown className="size-3.5 text-muted-foreground opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-rs-surface border-rs-border p-1 shadow-xl">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                Filter by label
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-rs-border" />
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <DropdownMenuItem
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                    !label && "bg-rs-accent/10 text-rs-link font-semibold"
                  )}
                  onSelect={() => {
                    setLabel(undefined)
                    setPage(1)
                  }}
                >
                  <span className="truncate">Labels (All)</span>
                  {!label && <div className="size-1.5 rounded-full bg-rs-link" />}
                </DropdownMenuItem>
                {LABELS.map((l) => (
                  <DropdownMenuItem
                    key={l}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm hover:bg-rs-accent hover:text-white transition-colors focus:bg-rs-accent focus:text-white",
                      l === label && "bg-rs-accent/10 text-rs-link font-semibold"
                    )}
                    onSelect={() => {
                      setLabel(l)
                      setPage(1)
                    }}
                  >
                    <span className="truncate">{l}</span>
                    {l === label && <div className="size-1.5 rounded-full bg-rs-link" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {currentUser && (
            <Button asChild className="h-9 gap-1.5 bg-green-600 text-white hover:bg-green-700">
              <Link to={`/${username}/${repoName}/issues/new`}>
                <Plus className="size-4" />
                New Issue
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-rs-border bg-rs-surface">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <AlertCircle className="mb-4 size-10 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">No issues found</h3>
            <p className="text-sm text-muted-foreground">
              {status === 'open' ? "There aren't any open issues." : "There aren't any closed issues."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-rs-border">
            {issues.map((issue) => (
              <li key={issue.id} className="flex p-4 hover:bg-rs-bg/50">
                <div className="mr-3 mt-1">
                  {issue.status === 'open' ? (
                    <CircleDot className="size-4 text-green-500" />
                  ) : (
                    <CheckCircle2 className="size-4 text-purple-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/${username}/${repoName}/issues/${issue.number}`}
                      className="text-base font-semibold text-foreground hover:text-rs-link"
                    >
                      {issue.title}
                    </Link>
                    {issue.labels?.map((lbl) => (
                      <Badge
                        key={lbl}
                        variant="outline"
                        className={cn('rounded-full px-2 py-0 text-xs font-medium', LABEL_COLORS[lbl] || 'bg-gray-500/10 text-gray-400')}
                      >
                        {lbl}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    #{issue.number} opened {formatRelativeTime(issue.createdAt)} by {issue.authorUsername}
                  </div>
                </div>
                {issue.commentCount > 0 && (
                  <div className="ml-4 flex shrink-0 items-start gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="size-4" />
                    <span>{issue.commentCount}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
