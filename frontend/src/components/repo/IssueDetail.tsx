import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CircleDot, CheckCircle2, MessageSquare, Trash2 } from 'lucide-react'
import { useIssue, useUpdateIssue, useDeleteIssue, useAddComment } from '@/hooks/useIssues'
import { useRepository } from '@/hooks/useRepository'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { formatRelativeTime, cn } from '@/lib/utils'

export function IssueDetail({ username, repoName, issueNumber }: { username: string; repoName: string; issueNumber: number }) {
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)
  
  const { data: repoRes } = useRepository(username!, repoName!)
  const repo = repoRes?.success ? repoRes.data : null
  const isRepoOwner = currentUser?.username === username

  const { data: issueRes, isLoading } = useIssue(username!, repoName!, Number(issueNumber))
  const issue = issueRes?.success ? issueRes.data : null
  const isAuthor = currentUser?.username === issue?.authorUsername

  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()
  const addComment = useAddComment()

  const [commentBody, setCommentBody] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading issue...</div>
  }

  if (!issue) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Issue not found.</div>
  }

  const handleToggleStatus = () => {
    updateIssue.mutate({
      owner: username!,
      name: repoName!,
      number: issue.number,
      status: issue.status === 'open' ? 'closed' : 'open'
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to permanently delete this issue?')) {
      setIsDeleting(true)
      deleteIssue.mutate({ owner: username!, name: repoName!, number: issue.number }, {
        onSuccess: () => navigate(`/${username}/${repoName}/issues`),
        onSettled: () => setIsDeleting(false)
      })
    }
  }

  const handleAddComment = () => {
    if (!commentBody.trim()) return
    addComment.mutate({ owner: username!, name: repoName!, number: issue.number, body: commentBody }, {
      onSuccess: () => setCommentBody('')
    })
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h1 className="text-3xl font-semibold text-foreground">{issue.title}</h1>
          <span className="text-3xl font-light text-muted-foreground">#{issue.number}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge
            variant="secondary"
            className={cn(
              'gap-1.5 rounded-full px-3 py-1 font-medium text-white',
              issue.status === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
            )}
          >
            {issue.status === 'open' ? <CircleDot className="size-4" /> : <CheckCircle2 className="size-4" />}
            {issue.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{issue.authorUsername}</span>
            <span>opened this issue {formatRelativeTime(issue.createdAt)}</span>
            <span>·</span>
            <span>{issue.commentCount} comments</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_256px]">
        {/* Timeline */}
        <div className="space-y-6">
          {/* Issue Body */}
          <div className="flex gap-4">
            <Avatar className="mt-1 size-10 shrink-0">
              <AvatarFallback className="bg-rs-accent text-white">{issue.authorUsername[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-md border border-rs-border bg-rs-surface">
              <div className="border-b border-rs-border bg-rs-bg/50 px-4 py-2.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{issue.authorUsername}</span>
                {' commented on '}
                {format(new Date(issue.createdAt), 'MMM d, yyyy')}
              </div>
              <div className="px-4 py-4 text-sm text-foreground">
                {issue.body ? <MarkdownRenderer content={issue.body} /> : <span className="italic text-muted-foreground">No description provided.</span>}
              </div>
            </div>
          </div>

          {/* Comments */}
          {issue.comments?.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="mt-1 size-10 shrink-0">
                <AvatarFallback className="bg-rs-accent text-white">{comment.authorUsername[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-md border border-rs-border bg-rs-surface">
                <div className="border-b border-rs-border bg-rs-bg/50 px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{comment.authorUsername}</span>
                  {' commented on '}
                  {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                </div>
                <div className="px-4 py-4 text-sm text-foreground">
                  <MarkdownRenderer content={comment.body} />
                </div>
              </div>
            </div>
          ))}

          {/* Add Comment Form */}
          {currentUser ? (
            <div className="flex gap-4 border-t border-rs-border pt-6">
              <Avatar className="mt-1 size-10 shrink-0">
                <AvatarFallback className="bg-rs-accent text-white">{currentUser.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Leave a comment"
                  className="min-h-[120px] bg-rs-surface font-mono text-sm focus:border-rs-accent"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2">
                  {(isAuthor || isRepoOwner) && (
                    <Button
                      variant="outline"
                      className="gap-2 text-muted-foreground"
                      onClick={handleToggleStatus}
                      disabled={updateIssue.isPending}
                    >
                      {issue.status === 'open' ? (
                        <><CheckCircle2 className="size-4 text-purple-500" /> Close issue</>
                      ) : (
                        <><CircleDot className="size-4 text-green-500" /> Reopen issue</>
                      )}
                    </Button>
                  )}
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={handleAddComment}
                    disabled={!commentBody.trim() || addComment.isPending}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-rs-border bg-rs-bg/50 p-4 text-center text-sm text-muted-foreground">
              Please <Link to="/sign-in" className="text-rs-link hover:underline">sign in</Link> to comment.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Labels</h3>
            {issue.labels?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map(lbl => (
                  <Badge key={lbl} variant="outline" className="rounded-full px-2 py-0 text-xs font-medium">
                    {lbl}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">None yet</p>
            )}
          </div>
          
          {isRepoOwner && (
            <div className="border-t border-rs-border pt-6">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
                Delete issue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
