type ChipsProps = {
  items: { id: string; label: string }[];
  emptyText?: string;
};

export function Chips({ items, emptyText = '—' }: ChipsProps) {
  if (items.length === 0) {
    return <span className="text-sm text-gray-400 dark:text-neutral-500">{emptyText}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {items.map(({ id, label }) => (
        <span
          key={id}
          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {label}
        </span>
      ))}
    </span>
  );
}
