// react-markdown ships ESM only, which jsdom/jest cannot parse. Tests that render
// markdown care that the content reaches the page, not how it is tokenised, so this
// renders the raw source and ignores the component overrides.
export default function ReactMarkdown({ children }: { children?: React.ReactNode }) {
  return <div data-testid="markdown">{children}</div>;
}
