'use client';
import * as PopoverPrimitive from '@radix-ui/react-popover';
// Use this over a hand-rolled dropdown: Radix handles outside-click and Escape
// dismissal, focus return, collision-aware placement and aria-expanded on the trigger.
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export function PopoverContent({ className = '', align = 'start', sideOffset = 6, ...props }) {
    return (<PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} sideOffset={sideOffset} className={`z-50 w-72 rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-lg focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 ${className}`} {...props}/>
    </PopoverPrimitive.Portal>);
}
