'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';

// Radix wires up the roving tab stops, arrow-key navigation and aria-selected state
// that hand-rolled button rows always get wrong. The look is an underline strip: the
// list draws a bottom border, the active trigger draws the accent on top of it.

export const Tabs = TabsPrimitive.Root;

type ListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

export function TabsList({ className = '', ...props }: ListProps) {
  return (
    <TabsPrimitive.List
      className={`flex items-center gap-1 border-b border-gray-200 dark:border-neutral-800 ${className}`}
      {...props}
    />
  );
}

type TriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;

export function TabsTrigger({ className = '', ...props }: TriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={`-mb-px inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-[var(--ui-accent)] data-[state=active]:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-500 dark:data-[state=active]:text-neutral-100 ${className}`}
      {...props}
    />
  );
}

type ContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;

export function TabsContent({ className = '', ...props }: ContentProps) {
  return (
    <TabsPrimitive.Content
      className={`pt-4 focus-visible:outline-none ${className}`}
      {...props}
    />
  );
}
