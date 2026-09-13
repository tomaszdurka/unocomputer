// Small status pill. `outline` is the one to reach for when the caller supplies its own
// semantic colours (a status badge passing bg-emerald-100 / text-emerald-800 / ...),
// since it ships no background or text colour of its own to fight with.

export type BadgeVariant = 'solid' | 'outline' | 'muted';

const base =
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold';

const variants: Record<BadgeVariant, string> = {
  solid: 'border-transparent bg-[var(--ui-accent)] text-[var(--ui-accent-fg)]',
  outline: 'border-gray-200 dark:border-neutral-800',
  muted:
    'border-transparent bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = 'solid', className = '', ...props }: BadgeProps) {
  return <span className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
