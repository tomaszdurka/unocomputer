// App-specific navigation and branding - this is YOUR file to customize.
// The sidebar components themselves come from @app/ui (template-owned).
import type { SidebarItem } from '@app/ui';
import {
  FolderIcon,
  MessagesIcon,
  MonitorIcon,
  PlayIcon,
  SlidersIcon,
} from '@app/ui';

export const brand = {
  name: 'UnoComputer',
  initial: 'U',
};

export const navigation: SidebarItem[] = [
  { href: '/runs', label: 'Runs', icon: <PlayIcon />, match: 'prefix' },
  { href: '/sessions', label: 'Sessions', icon: <MessagesIcon />, match: 'prefix' },
  { href: '/workspaces', label: 'Workspaces', icon: <FolderIcon />, match: 'prefix' },
];

export const settingsNavigation: SidebarItem[] = [
  { href: '/settings/general', label: 'General', icon: <SlidersIcon /> },
  { href: '/settings/appearance', label: 'Appearance', icon: <MonitorIcon /> },
];
