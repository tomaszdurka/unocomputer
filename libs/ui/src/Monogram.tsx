/**
 * A name reduced to one or two letters in a small rounded square.
 *
 * For nav built from data - projects, clients, workspaces - where every item
 * would otherwise carry the same generic icon. On the collapsed sidebar rail
 * that makes a run of identical glyphs; a monogram keeps them apart. Pass it to
 * NavItem as `collapsedIcon`.
 */

function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  // Two words give two letters ("Website Manager" -> WM); one word gives one.
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function Monogram({
  name,
  className = '',
}: {
  name: string;
  /** The label is already on the link, so the square itself is decorative. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-6 flex-none place-content-center rounded-md bg-gray-200 text-[10px] font-semibold tracking-tight text-gray-700 dark:bg-neutral-800 dark:text-neutral-200 ${className}`}
    >
      {initialsFrom(name)}
    </span>
  );
}
