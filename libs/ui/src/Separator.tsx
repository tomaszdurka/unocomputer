// A rule. Radix ships a Separator primitive, but it exists only to set role/aria-
// orientation, which is three lines - not worth another client-side dependency.
// Decorative by default: a purely visual rule should be hidden from assistive tech.

type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  /** Set false when the rule genuinely separates content groups, not just decorates. */
  decorative?: boolean;
  className?: string;
};

export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className = '',
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={`shrink-0 bg-gray-200 dark:bg-neutral-800 ${
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'
      } ${className}`}
    />
  );
}
