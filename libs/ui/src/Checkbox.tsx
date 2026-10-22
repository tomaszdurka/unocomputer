'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

// Radix keeps the checked state accessible (real button semantics, aria-checked,
// space-to-toggle) while letting the box render identically across platforms.
// Pair it with a <Label htmlFor=...> or wrap both in a label element.

type CheckboxProps = React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
>;

export function Checkbox({ className = '', ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={`flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--ui-accent)] data-[state=checked]:bg-[var(--ui-accent)] data-[state=checked]:text-[var(--ui-accent-fg)] dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-neutral-500 ${className}`}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
