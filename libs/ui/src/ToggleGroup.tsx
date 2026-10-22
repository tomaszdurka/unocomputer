'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

// A segmented control: one visible group, one (type="single") or several
// (type="multiple") pressed segments. Radix keeps the pressed state on real buttons
// with aria-pressed, and makes the group one tab stop with arrow-key movement.

type RootProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
>;

export function ToggleGroup({ className = '', ...props }: RootProps) {
  return (
    <ToggleGroupPrimitive.Root
      className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    />
  );
}

type ItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
>;

export function ToggleGroupItem({ className = '', ...props }: ItemProps) {
  return (
    <ToggleGroupPrimitive.Item
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-white data-[state=on]:font-medium data-[state=on]:text-gray-900 data-[state=on]:shadow-sm dark:text-neutral-400 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-500 dark:data-[state=on]:bg-neutral-800 dark:data-[state=on]:text-neutral-100 [&>svg]:size-4 [&>svg]:shrink-0 ${className}`}
      {...props}
    />
  );
}
