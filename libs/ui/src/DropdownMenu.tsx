'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

// The "..." overflow menu and friends. Radix provides typeahead, arrow-key navigation,
// outside-click/Escape dismissal and focus return - none of which a Popover full of
// buttons gives you for free.

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

type ContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;

export function DropdownMenuContent({
  className = '',
  align = 'end',
  sideOffset = 6,
  ...props
}: ContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={`z-50 min-w-40 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

type ItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & {
  /** Draws the item in red for delete-shaped actions. */
  destructive?: boolean;
};

export function DropdownMenuItem({
  className = '',
  destructive = false,
  ...props
}: ItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={`flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-50 dark:data-[highlighted]:bg-neutral-800 [&>svg]:size-4 [&>svg]:shrink-0 ${
        destructive
          ? 'text-red-600 data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-950/40'
          : ''
      } ${className}`}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
      {children}
    </DropdownMenuPrimitive.Label>
  );
}

export function DropdownMenuSeparator() {
  return (
    <DropdownMenuPrimitive.Separator className="my-1 h-px bg-gray-200 dark:bg-neutral-800" />
  );
}
