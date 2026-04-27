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
            <h1 className="text-3xl font-bold text-white border-b border-rs-border/60 pb-3 mb-6 mt-8 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-white border-b border-rs-border/60 pb-2 mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-[15px] leading-7 text-gray-300 mb-4">{children}</p>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-rs-link hover:underline font-medium" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-[15px] text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-[15px] text-gray-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-rs-border/60 pl-4 py-1 italic text-gray-400 mb-4 bg-rs-surface/30 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName
            const match = /language-(\w+)/.exec(codeClassName || '')
            const lang = match ? match[1] : undefined

            if (isInline) {
              return (
                <code className="rounded bg-rs-elevated/80 px-1.5 py-0.5 font-mono text-[13px] text-foreground border border-rs-border/30">
                  {children}
                </code>
              )
            }
            
            const codeString = String(children).replace(/\n$/, '')
            const highlighted = highlightCode(codeString, lang)

            return (
              <code 
                className={cn("block py-0", codeClassName)} 
                {...props}
                dangerouslySetInnerHTML={{ __html: highlighted }} 
              />
            )
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-rs-border/50 bg-[#0d1117] p-5 font-mono text-[13px] text-foreground mb-5 shadow-sm">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-hidden border border-rs-border/50 rounded-lg mb-6 shadow-sm">
              <table className="w-full border-collapse text-[14px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-rs-elevated/50 border-b border-rs-border/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-semibold text-white border-r border-rs-border/30 last:border-r-0">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-rs-border/30 last:border-b-0 text-gray-300 border-r border-rs-border/30 last:border-r-0">{children}</td>
          ),
          hr: () => <hr className="border-rs-border/40 my-8" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ''} className="max-w-full rounded-lg border border-rs-border/50 my-6 shadow-md" />
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-gray-500">{children}</del>
          ),
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-3 mt-1 accent-rs-accent h-4 w-4 rounded border-rs-border bg-rs-surface"
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
