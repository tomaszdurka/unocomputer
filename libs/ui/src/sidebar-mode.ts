/**
 * The sidebar's width, and where the choice lives.
 *
 * A cookie, not localStorage, so the server renders the right width from the first
 * byte. Read after mount instead, the sidebar comes up expanded and then animates
 * shut on first paint - and does it again on any navigation that remounts the shell.
 *
 * This module has no client-only code, so a server component (the app layout) can
 * read the cookie with it.
 */

export type SidebarMode = 'expanded' | 'collapsed';

export const SIDEBAR_MODE_COOKIE = 'ui-sidebar-mode';

/** What a stored cookie value means. Anything unrecognised is 'expanded'. */
export function sidebarModeFrom(
  stored: string | undefined | null,
): SidebarMode {
  return stored === 'collapsed' ? 'collapsed' : 'expanded';
}
