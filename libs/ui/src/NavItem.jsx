'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * @param {object} props
 * @param {string} props.href
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {'exact'|'prefix'} [props.match] Match nested routes too. Default: exact.
 */
export function NavItem({ href, icon, children, match = 'exact' }) {
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
          ? 'bg-mint/10 font-medium text-mint dark:bg-mint/15'
          : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'
      }`}
    >
      {icon ? <span className="size-4 shrink-0 [&>svg]:size-4">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </Link>
  );
}
