import Link from 'next/link';
import { NavItem } from './NavItem';
import { ChevronLeftIcon } from './icons';
import type { SidebarItem } from './Sidebar';

type SettingsSidebarProps = {
  title?: string;
  backHref?: string;
  backLabel?: string;
  items: SidebarItem[];
};

export function SettingsSidebar({
  title = 'Settings',
  backHref = '/',
  backLabel = 'Back to app',
  items,
}: SettingsSidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="px-3 pb-1 pt-4">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
        >
          <ChevronLeftIcon className="size-4" />
          {backLabel}
        </Link>
      </div>

      <div className="px-6 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
        {title}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} match="prefix">
            {item.label}
          </NavItem>
        ))}
      </nav>
    </aside>
  );
}
