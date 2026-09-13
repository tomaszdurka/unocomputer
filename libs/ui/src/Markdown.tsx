'use client';

// Renders trusted markdown styled for both themes. Deliberately NOT on the barrel
// (react-markdown is client-side and heavy) - import from '@app/ui/markdown' so only
// pages that render markdown pay for it. For jest, map 'react-markdown' to the mock in
// apps/admin/src/test/react-markdown.mock.tsx (ESM-only package, jsdom can't parse it).
import ReactMarkdown, { type Components } from 'react-markdown';

const components: Components = {
  h1: (props) => <h1 className="mt-5 mb-2 text-lg font-semibold first:mt-0" {...props} />,
  h2: (props) => (
    <h2 className="mt-4 mb-2 text-base font-semibold first:mt-0" {...props} />
  ),
  h3: (props) => <h3 className="mt-3 mb-1 text-sm font-semibold first:mt-0" {...props} />,
  p: (props) => <p className="mb-3 last:mb-0" {...props} />,
  ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
  a: (props) => (
    <a
      className="underline hover:text-gray-900 dark:hover:text-neutral-100"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-neutral-800"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="mb-3 overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-neutral-800"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-2 border-gray-300 pl-3 text-gray-500 dark:border-neutral-700 dark:text-neutral-400"
      {...props}
    />
  ),
  hr: (props) => (
    <hr className="my-4 border-gray-200 dark:border-neutral-800" {...props} />
  ),
  strong: (props) => (
    <strong className="font-semibold text-gray-900 dark:text-neutral-100" {...props} />
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
