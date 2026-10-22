import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * What `which <binary>` answers: the first executable file of that name on
 * PATH, or null. Done in-process so a settings page does not spawn a shell
 * per provider, and so the lookup sees the same PATH the run would - under
 * launchd that is the pinned SERVICE_PATH, not a login shell's.
 */
export function which(
  binary: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (!binary || binary.includes(path.sep)) return null;
  for (const dir of (env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, binary);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // Not here; try the next PATH entry.
    }
  }
  return null;
}
