import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCreateIssue } from '@/hooks/useIssues'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const LABELS = ['bug', 'enhancement', 'question', 'documentation', 'help wanted']

export function NewIssueForm({ username, repoName }: { username: string; repoName: string }) {
  const navigate = useNavigate()
  const currentUser = useAuthStore(s => s.user)
  const createIssue = useCreateIssue()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  if (!currentUser) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Please sign in to create an issue.</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    createIssue.mutate({
      owner: username!,
      name: repoName!,
      title,
      body,
      labels: selectedLabels
    }, {
      onSuccess: (res) => {
        if (res.success && res.data) {
          navigate(`/${username}/${repoName}/issues/${res.data.number}`)
        }
      }
    })
  }

  const toggleLabel = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  return (
    <div className="py-2">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Create New Issue</h1>
      
      <div className="flex gap-4">
        <Avatar className="mt-1 hidden size-10 shrink-0 sm:block">
          <AvatarFallback className="bg-rs-accent text-white">{currentUser.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 rounded-md border border-rs-border bg-rs-surface p-4">
          <Input
            placeholder="Title"
            className="bg-rs-bg focus:border-rs-accent"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            placeholder="Leave a comment (markdown supported)"
            className="min-h-[200px] bg-rs-bg font-mono text-sm focus:border-rs-accent"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          
          <div className="space-y-2 rounded-md border border-rs-border p-3">
            <h3 className="text-sm font-medium text-foreground">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {LABELS.map(lbl => {
                const isSelected = selectedLabels.includes(lbl)
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => toggleLabel(lbl)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected 
                        ? 'bg-rs-accent/20 border-rs-accent text-rs-accent' 
                        : 'bg-rs-bg border-rs-border text-muted-foreground hover:border-rs-accent'
                    }`}
                  >
                    {lbl}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              asChild
            >
              <Link to={`/${username}/${repoName}/issues`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={!title.trim() || createIssue.isPending}
            >
              {createIssue.isPending ? 'Submitting...' : 'Submit new issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
