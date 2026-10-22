// Placeholder block for content that is still loading. Shape it with width/height
// classes: <Skeleton className="h-4 w-32" />.

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-neutral-800 ${className}`}
      {...props}
    />
  );
}
