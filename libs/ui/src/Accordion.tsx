'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';

// Disclosure rows with correct button/region semantics and arrow-key navigation.
// No open/close animation on purpose: it needs measured heights (keyframes reading
// a Radix CSS variable), which is app-level CSS a self-contained kit should not demand.

export const Accordion = AccordionPrimitive.Root;

type ItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

export function AccordionItem({ className = '', ...props }: ItemProps) {
  return (
    <AccordionPrimitive.Item
      className={`border-b border-gray-200 last:border-b-0 dark:border-neutral-800 ${className}`}
      {...props}
    />
  );
}

type TriggerProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
>;

export function AccordionTrigger({
  className = '',
  children,
  ...props
}: TriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={`group flex flex-1 items-center justify-between gap-2 py-3 text-left text-sm font-medium transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:hover:text-neutral-100 dark:focus-visible:ring-neutral-500 ${className}`}
        {...props}
      >
        {children}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

type ContentProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
>;

export function AccordionContent({
  className = '',
  children,
  ...props
}: ContentProps) {
  return (
    <AccordionPrimitive.Content
      className={`overflow-hidden text-sm ${className}`}
      {...props}
    >
      <div className="pb-3">{children}</div>
    </AccordionPrimitive.Content>
  );
}
