import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 font-display text-xl font-bold text-slate-900">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 font-display text-base font-bold text-slate-800">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
        {children}
      </p>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        className="font-semibold text-violet-600 underline underline-offset-4 hover:text-violet-700"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 sm:text-base">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 sm:text-base">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-slate-900">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-700">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-6 border-slate-200" />,
    ...components,
  }
}

