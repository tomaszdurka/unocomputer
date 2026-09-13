// Shell and theming - server-safe, no third-party runtime deps. Importing from here
// must stay cheap: every page's layout pulls it in.
//
// The Radix-backed overlays (Dialog, Popover, Select) are deliberately NOT re-exported.
// Radix is client-side and ~33kB, and a barrel re-export drags it into any client
// component that imports anything from '@app/ui'. Import them by subpath instead so
// only the pages that use them pay for them:
//
//   import { Dialog, DialogContent } from '@app/ui/dialog';
//   import { Popover, PopoverContent } from '@app/ui/popover';
//   import { Select, SelectTrigger } from '@app/ui/select';
//
// Markdown (react-markdown, client-side) is kept off the barrel for the same reason:
//
//   import { Markdown } from '@app/ui/markdown';
export * from './icons';
export * from './Button';
export * from './Badge';
export * from './Card';
export * from './Field';
export * from './Separator';
export * from './NavItem';
export * from './Sidebar';
export * from './SettingsSidebar';
export * from './DataTable';
export * from './Pagination';
export * from './Chips';
export * from './LinkPicker';
export * from './theme/AppearanceSettings';
export * from './theme/init-script';
