'use client';
import * as SelectPrimitive from '@radix-ui/react-select';
// A native <select> is still the right default for short, plain option lists - it is
// free, accessible and renders as the OS control. Reach for this only when you need
// what a native select cannot do: rich option content, grouping with custom markup,
// or consistent cross-platform styling of the open list.
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
function ChevronDown() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 opacity-60" aria-hidden="true">
      <path d="m6 9 6 6 6-6"/>
    </svg>);
}
export function SelectTrigger({ className = '', children, ...props }) {
    return (<SelectPrimitive.Trigger className={`flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none data-[placeholder]:text-gray-400 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400 dark:data-[placeholder]:text-neutral-500 ${className}`} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>);
}
export function SelectContent({ className = '', children, ...props }) {
    return (<SelectPrimitive.Portal>
      <SelectPrimitive.Content position="popper" sideOffset={6} className={`z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${className}`} {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>);
}
export function SelectItem({ className = '', children, ...props }) {
    return (<SelectPrimitive.Item className={`relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-gray-100 data-[disabled]:opacity-50 dark:data-[highlighted]:bg-neutral-800 ${className}`} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>);
}
export function SelectLabel({ children }) {
    return (<SelectPrimitive.Label className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
      {children}
    </SelectPrimitive.Label>);
}
export function SelectSeparator() {
    return <SelectPrimitive.Separator className="my-1 h-px bg-gray-200 dark:bg-neutral-800"/>;
}
