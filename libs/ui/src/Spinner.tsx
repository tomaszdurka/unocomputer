// Indeterminate progress. Size it with a `size-*` class (defaults to size-5); the
// label is for assistive tech and stays visually hidden.

type SpinnerProps = {
  label?: string;
  className?: string;
};

export function Spinner({
  label = 'Loading',
  className = 'size-5',
}: SpinnerProps) {
  return (
    <span role="status" className="inline-flex">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={`animate-spin text-gray-400 dark:text-neutral-500 ${className}`}
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
