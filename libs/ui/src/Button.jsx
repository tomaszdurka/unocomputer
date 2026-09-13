// Plain-Tailwind button in the template's gray/neutral palette. No cva, no clsx - the
// variant maps below are the whole mechanism, and `className` is appended last so a
// caller can extend (not reliably override - there is no tailwind-merge here).
const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ' +
    'disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-neutral-500 ' +
    '[&>svg]:size-4 [&>svg]:shrink-0';
const variants = {
    // Reads the app's accent tokens (see globals.css) so a rebrand needs no fork here.
    primary: 'bg-[var(--ui-accent)] text-[var(--ui-accent-fg)] hover:bg-[var(--ui-accent-hover)]',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
};
const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    icon: 'size-9 p-0',
};
export function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...props }) {
    return (<button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}/>);
}
