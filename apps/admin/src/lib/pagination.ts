/** `?page=` as a sane 1-based number; anything unparseable falls back to page 1. */
export function pageFromSearchParams(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
