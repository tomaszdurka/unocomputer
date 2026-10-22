// The "nothing here yet" panel every list and detail screen needs. Always say what
// the user can do about it - pass an action whenever one exists.

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-16 text-center text-gray-500 dark:text-neutral-400">
      {icon ? <div className="mb-2 [&>svg]:size-8">{icon}</div> : null}
      <div className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        {title}
      </div>
      {description ? <div className="text-sm">{description}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
