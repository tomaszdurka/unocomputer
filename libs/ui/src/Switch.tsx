'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';

// An on/off toggle for settings that apply immediately. For a choice that is only
// submitted with a form, prefer a Checkbox - that is what the pattern means to users.

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

export function Switch({ className = '', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={`inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--ui-accent)] dark:bg-neutral-700 dark:focus-visible:ring-neutral-500 dark:data-[state=checked]:bg-[var(--ui-accent)] ${className}`}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px] dark:bg-neutral-100" />
    </SwitchPrimitive.Root>
  );
}
