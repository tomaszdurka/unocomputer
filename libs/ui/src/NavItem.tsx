'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItemProps = {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Match nested routes too (e.g. /items/new highlights /). Default: exact. */
  match?: 'exact' | 'prefix';
};

export function NavItem({ href, icon, children, match = 'exact' }: NavItemProps) {
  const pathname = usePathname();
  const active =
    match === 'prefix'
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-[var(--ui-accent-soft)] font-medium text-[var(--ui-accent)]'
          : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'
      }`}
    >
      {icon ? <span className="size-4 shrink-0 [&>svg]:size-4">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </Link>
  );
}
