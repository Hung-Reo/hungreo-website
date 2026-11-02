import ReactMarkdown from 'react-markdown'

// Raw HTML stays off (react-markdown default) and unsafe URLs are dropped by its
// default urlTransform, so card text cannot inject markup.

/** Turns "[3]" citations into links to the source list, with the source name on hover. */
export function linkCitations(text: string, sourceTitles: Map<number, string>): string {
  return text.replace(/\[(\d{1,2})\](?![(\[])/g, (match, n) => {
    const title = sourceTitles.get(Number(n))
    if (!title) return match
    return `[\\[${n}\\]](#src-${n} "${title.replace(/["\\]/g, '')}")`
  })
}

export function Markdown({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, title, children }) => {
          const internal = href?.startsWith('#')
          return (
            <a
              href={href}
              title={title}
              className={internal ? 'font-medium text-primary-600 no-underline hover:underline' : 'text-primary-600 underline'}
              {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            >
              {children}
            </a>
          )
        },
        ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
