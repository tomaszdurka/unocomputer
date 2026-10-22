'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

// Radix handles the hover/focus timing, escape dismissal and aria-describedby wiring.
// Mount one TooltipProvider near the app root (it holds the shared delay settings);
// each tooltip is then Tooltip > TooltipTrigger + TooltipContent.

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type ContentProps = React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
>;

export function TooltipContent({
  className = '',
  sideOffset = 6,
  ...props
}: ContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={`z-50 max-w-xs rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900 ${className}`}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
