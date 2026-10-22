/**
 * One row of `devin list --format json`, run in a workspace folder. The field
 * names are what the CSV header of the same command prints.
 */
export type DevinSessionRow = {
  id?: unknown;
  short_id?: unknown;
  working_directory?: unknown;
  last_activity_at?: unknown;
  title?: unknown;
};

/**
 * Which of Devin's sessions is ours. The first run plants a
 * `[SESSION-ID=<uno session id>]` marker at the top of its prompt, and Devin
 * titles a session from its first prompt, so the marker is the match. With no
 * titled match, the most recent session in this folder is the best guess: the
 * run that just finished is almost always the newest thing there.
 */
export function findDevinSessionId(
  rows: unknown,
  unoSessionId: string,
  workingDir: string,
): string | null {
  if (!Array.isArray(rows)) return null;
  const inFolder = rows.filter(
    (row): row is DevinSessionRow =>
      !!row &&
      typeof row === 'object' &&
      typeof (row as DevinSessionRow).id === 'string' &&
      (typeof (row as DevinSessionRow).working_directory !== 'string' ||
        (row as DevinSessionRow).working_directory === workingDir),
  );
  const titled = inFolder.find(
    (row) => typeof row.title === 'string' && row.title.includes(unoSessionId),
  );
  if (titled) return titled.id as string;

  const newest = [...inFolder].sort((a, b) =>
    String(b.last_activity_at ?? '').localeCompare(
      String(a.last_activity_at ?? ''),
    ),
  )[0];
  return newest ? (newest.id as string) : null;
}
