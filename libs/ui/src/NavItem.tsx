'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarCollapsed } from './Sidebar';

type NavItemProps = {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Match nested routes too (e.g. /items/new highlights /). Default: exact. */
  match?: 'exact' | 'prefix';
  /**
   * The tooltip and accessible name used on the collapsed rail. Defaults to
   * `children`, which is right whenever the label is a plain string.
   */
  label?: string;
  /**
   * Shown instead of `icon` on the collapsed rail. For data-driven nav where
   * every item shares one generic icon, pass `<Monogram name={...} />` so the
   * rail does not become a run of identical glyphs. Sizes itself.
   */
  collapsedIcon?: React.ReactNode;
};

export function NavItem({
  href,
  icon,
  children,
  match = 'exact',
  label,
  collapsedIcon,
}: NavItemProps) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const active =
    match === 'prefix'
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  // On the rail the label is the tooltip, so a long one still identifies the
  // destination; expanded, it is already on screen and a tooltip would be noise.
  const title = label ?? (typeof children === 'string' ? children : undefined);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? title : undefined}
      className={`flex items-center rounded-lg text-sm transition-colors ${
        collapsed ? 'size-10 justify-center' : 'gap-2.5 px-3 py-2'
      } ${
        active
          ? 'bg-[var(--ui-accent-soft)] font-medium text-[var(--ui-accent)]'
          : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100'
      }`}
    >
      {collapsed && collapsedIcon ? (
        collapsedIcon
      ) : icon ? (
        <span className="size-4 shrink-0 [&>svg]:size-4">{icon}</span>
      ) : null}
      {/* Collapsed, the label stays in the DOM for assistive tech - the rail is
          not a different navigation, only a narrower one. */}
      <span className={collapsed ? 'sr-only' : 'truncate'}>{children}</span>
    </Link>
  );
}
