// The standard bordered surface. Same border/background pair as DataTable, so a page
// mixing cards and listings reads as one system.

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`flex flex-col gap-1.5 px-6 py-4 ${className}`} {...props} />;
}

export function CardTitle({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`text-base font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`text-sm text-gray-500 dark:text-neutral-400 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = '', ...props }: DivProps) {
  return <div className={`px-6 pb-6 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`flex items-center gap-2 border-t border-gray-200 px-6 py-4 dark:border-neutral-800 ${className}`}
      {...props}
    />
  );
}
