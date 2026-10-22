'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import Link from 'next/link';
import { NavItem } from './NavItem';
import { PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon } from './icons';
import { SIDEBAR_MODE_COOKIE, type SidebarMode } from './sidebar-mode';

export type { SidebarMode } from './sidebar-mode';

/* ------------------------------------------------------------------ *
 * The app sidebar: full height on the left, in one of two widths.
 *
 *   `expanded`  - icons and labels, the brand at the top. The default.
 *   `collapsed` - a narrow rail of the same icons, each named by its tooltip
 *                 and to assistive tech. Nothing pops out on hover: the rail
 *                 IS the sidebar, only narrower.
 *
 * The control is the button at the top: beside the brand when expanded, alone
 * when collapsed. The choice is per browser, kept in a cookie the app layout
 * reads and passes back as `initialMode`, so the first render is already right.
 * ------------------------------------------------------------------ */

export type SidebarItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  match?: 'exact' | 'prefix';
};

type SidebarProps = {
  brandName: string;
  /** Kept for API compatibility with earlier template versions; unused. */
  brandInitial?: string;
  items: SidebarItem[];
  settingsHref?: string;
  /**
   * The width to render first - the cookie as the app layout read it
   * (`sidebarModeFrom(cookieValue)`). Defaults to 'expanded'.
   */
  initialMode?: SidebarMode;
  /**
   * Primary action pinned under the brand - a "New X" button or a workspace
   * switcher. Shown in both widths, so make it rail-aware: on the rail it gets
   * 40px, where a label does not fit. See `useSidebarCollapsed()`.
   */
  action?: React.ReactNode;
  /**
   * Rendered inside the scrollable nav, after `items`. The escape hatch for nav that
   * is not a static list - a data-driven section, say - composed from SidebarSection
   * and NavItem so it still looks native, and collapses with the rest.
   */
  children?: React.ReactNode;
};

/**
 * Whether the surrounding sidebar is the narrow rail. NavItem and SidebarSection
 * read it, so app-composed nav collapses with the built-in items. Outside a
 * Sidebar (the settings sub-sidebar) it is false and nothing changes.
 */
const SidebarCollapsedContext = createContext(false);

export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext);
}

function saveMode(mode: SidebarMode): void {
  try {
    // A year, path-wide, never sent cross-site. Not httpOnly: the browser is
    // what writes it, and the server only reads it to pick a width.
    document.cookie = `${SIDEBAR_MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Private browsing and the like: the choice simply does not persist.
  }
}

export function Sidebar({
  brandName,
  items,
  settingsHref = '/settings',
  initialMode = 'expanded',
  action,
  children,
}: SidebarProps) {
  const [mode, setMode] = useState<SidebarMode>(initialMode);
  const collapsed = mode === 'collapsed';

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next: SidebarMode =
        current === 'expanded' ? 'collapsed' : 'expanded';
      saveMode(next);
      return next;
    });
  }, []);

  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <SidebarCollapsedContext.Provider value={collapsed}>
      <aside
        data-mode={mode}
        className={`flex shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-[width] duration-200 ease-out dark:border-neutral-800 dark:bg-neutral-900 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        <div
          className={`flex h-14 items-center ${
            collapsed ? 'justify-center px-2' : 'gap-2 pl-4 pr-2'
          }`}
        >
          {/* Collapsed, the top row is only the button: the brand has nowhere to fit. */}
          {collapsed ? null : (
            <Link
              href="/"
              className="flex-1 truncate text-sm font-semibold tracking-tight"
            >
              {brandName}
            </Link>
          )}
          <button
            type="button"
            onClick={toggleMode}
            aria-label={label}
            title={label}
            className="grid size-8 flex-none cursor-pointer place-content-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="size-4" />
            ) : (
              <PanelLeftCloseIcon className="size-4" />
            )}
          </button>
        </div>

        {/* The action shows in both widths - it is often the only way to reach
            something (a workspace switcher, say), so the rail must not swallow
            it. The rail leaves it 40px, which a label will not fit: an action
            is expected to read `useSidebarCollapsed()` and render an icon or a
            Monogram there. */}
        {action ? (
          <div
            className={
              collapsed
                ? 'flex justify-center px-2 pb-1 pt-2'
                : 'px-3 pb-1 pt-2'
            }
          >
            {action}
          </div>
        ) : null}

        <nav
          className={`flex-1 space-y-0.5 overflow-y-auto py-3 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
        >
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              match={item.match}
            >
              {item.label}
            </NavItem>
          ))}
          {children}
        </nav>

        <div
          className={`border-t border-gray-200 py-3 dark:border-neutral-800 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
        >
          <NavItem href={settingsHref} icon={<SettingsIcon />} match="prefix">
            Settings
          </NavItem>
        </div>
      </aside>
    </SidebarCollapsedContext.Provider>
  );
}

type SidebarSectionProps = {
  title?: React.ReactNode;
  /** Small control on the title row - an icon button, a "new" link. */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/** A titled group inside the Sidebar's `children` slot. */
export function SidebarSection({
  title,
  action,
  children,
}: SidebarSectionProps) {
  const collapsed = useSidebarCollapsed();

  return (
    <div className="pt-4">
      {/* The title row is text: on the rail it would not fit, so the group
          becomes a plain run of icons separated by the padding above. */}
      {!collapsed && (title || action) ? (
        <div className="mb-1 flex items-center justify-between px-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            {title}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
