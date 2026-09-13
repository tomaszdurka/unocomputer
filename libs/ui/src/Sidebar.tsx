import Link from 'next/link';
import { NavItem } from './NavItem';
import { SettingsIcon } from './icons';

export type SidebarItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  match?: 'exact' | 'prefix';
};

type SidebarProps = {
  brandName: string;
  brandInitial?: string;
  items: SidebarItem[];
  settingsHref?: string;
  /** Primary action pinned under the brand - a "New X" button, say. Optional. */
  action?: React.ReactNode;
};

export function Sidebar({
  brandName,
  brandInitial,
  items,
  settingsHref = '/settings',
  action,
}: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-[var(--ui-accent)] text-[11px] font-bold text-[var(--ui-accent-fg)]">
            {brandInitial ?? brandName.charAt(0).toUpperCase()}
          </span>
          {brandName}
        </Link>
      </div>

      {action ? <div className="px-3 pb-1 pt-2">{action}</div> : null}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} match={item.match}>
            {item.label}
          </NavItem>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-3 py-3 dark:border-neutral-800">
        <NavItem href={settingsHref} icon={<SettingsIcon />} match="prefix">
          Settings
        </NavItem>
      </div>
    </aside>
  );
}
