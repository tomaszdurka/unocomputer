// Shell and theming - server-safe, no third-party runtime deps. Importing from here
// must stay cheap: every page's layout pulls it in.
//
// The Radix-backed components are deliberately NOT re-exported. Radix is client-side
// and each package is tens of kB; a barrel re-export drags it into any client
// component that imports anything from '@app/ui'. Import them by subpath instead so
// only the pages that use them pay for them:
//
//   import { Dialog, DialogContent, ConfirmDialog } from '@app/ui/dialog';
//   import { Popover, PopoverContent } from '@app/ui/popover';
//   import { Select, SelectTrigger } from '@app/ui/select';
//   import { Tabs, TabsList, TabsTrigger, TabsContent } from '@app/ui/tabs';
//   import { Tooltip, TooltipProvider, TooltipContent } from '@app/ui/tooltip';
//   import { Switch } from '@app/ui/switch';
//   import { Checkbox } from '@app/ui/checkbox';
//   import { DropdownMenu, DropdownMenuContent } from '@app/ui/dropdown-menu';
//   import { Accordion, AccordionItem } from '@app/ui/accordion';
//   import { ToggleGroup, ToggleGroupItem } from '@app/ui/toggle-group';
//   import { Combobox } from '@app/ui/combobox';
//   import { SortableList } from '@app/ui/sortable-list';
//
// Markdown (react-markdown, client-side) and the Toast provider (client context) are
// kept off the barrel for the same reason:
//
//   import { Markdown } from '@app/ui/markdown';
//   import { ToastProvider, useToast } from '@app/ui/toast';
export * from './icons';
export * from './Button';
export * from './Badge';
export * from './Card';
export * from './Field';
export * from './Separator';
export * from './Alert';
export * from './Spinner';
export * from './Skeleton';
export * from './EmptyState';
export * from './PageHeader';
export * from './Breadcrumbs';
export * from './Settings';
export * from './Monogram';
export * from './NavItem';
export * from './sidebar-mode';
export * from './Sidebar';
export * from './SettingsSidebar';
export * from './DataTable';
export * from './Pagination';
export * from './Chips';
export * from './LinkPicker';
export * from './theme/AppearanceSettings';
export * from './theme/init-script';
