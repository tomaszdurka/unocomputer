import Link from 'next/link';

// A path trail. Items with an href are links; the last item is usually the current
// page and renders as plain text (aria-current set automatically when it has no href).

export type BreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-neutral-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5 opacity-50"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-gray-900 dark:hover:text-neutral-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={index === items.length - 1 ? 'page' : undefined}
                className="text-gray-900 dark:text-neutral-100"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
