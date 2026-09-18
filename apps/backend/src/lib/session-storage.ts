import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Session, Workspace } from '../database/types';

export type SessionProvider = 'codex' | 'gemini';

/**
 * Where Uno keeps what it needs to resume a CLI's conversation: SESSIONS_DIR, or
 * ./data/sessions beside the database when unset. Never the workspace folder,
 * which may be a real project of the caller's.
 */
export function sessionsDir(env: Record<string, string | undefined> = process.env): string {
  return env.SESSIONS_DIR ?? path.resolve(process.cwd(), '../../data/sessions');
}

/**
 * The folder for one provider's state about one session, created on demand.
 *
 * State used to live at <workspace>/.<provider>/<sessionId>. A session made
 * back then keeps resuming only if that folder comes along, so it is moved the
 * first time it is asked for. Copy then remove, not rename: the data root and
 * the workspace can be on different volumes.
 */
export function providerSessionDir(
  provider: SessionProvider,
  session: Pick<Session, 'sessionId'>,
  workspace: Pick<Workspace, 'workingDir'>,
  root: string = sessionsDir(),
): string {
  const target = path.join(root, provider, session.sessionId);
  if (fs.existsSync(target)) return target;

  const legacyParent = path.join(workspace.workingDir, `.${provider}`);
  const legacy = path.join(legacyParent, session.sessionId);
  if (fs.existsSync(legacy)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(legacy, target, { recursive: true });
    fs.rmSync(legacy, { recursive: true, force: true });
    try {
      // Only succeeds once the last session has left, which is the point.
      fs.rmdirSync(legacyParent);
    } catch {
      // Other sessions still live there, or it is already gone.
    }
    return target;
  }

  fs.mkdirSync(target, { recursive: true });
  return target;
}
