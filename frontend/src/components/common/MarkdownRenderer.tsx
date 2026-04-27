import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { highlightCode } from '@/lib/highlight'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <article className={cn("prose-rs max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-white border-b border-rs-border pb-2 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-white border-b border-rs-border pb-2 mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-white mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">{children}</p>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-rs-link hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-4 ml-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-muted-foreground">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-rs-border pl-4 italic text-muted-foreground mb-4">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName
            const match = /language-(\w+)/.exec(codeClassName || '')
            const lang = match ? match[1] : undefined

            if (isInline) {
              return (
                <code className="rounded bg-rs-elevated px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {children}
                </code>
              )
            }
            
            const codeString = String(children).replace(/\n$/, '')
            const highlighted = highlightCode(codeString, lang)

            return (
              <code 
                className={cn("block", codeClassName)} 
                {...props}
                dangerouslySetInnerHTML={{ __html: highlighted }} 
              />
            )
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md border border-rs-border bg-[#0d1117] p-4 font-mono text-xs text-foreground mb-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-rs-border bg-rs-elevated/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-white">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-b border-rs-border text-muted-foreground">{children}</td>
          ),
          hr: () => <hr className="border-rs-border my-6" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ''} className="max-w-full rounded-md border border-rs-border" />
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">{children}</del>
          ),
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 accent-rs-accent"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
