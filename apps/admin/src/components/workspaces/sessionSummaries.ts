import type { Run, Session, Workspace, WorkspaceSessionSummary } from '#/lib/types';

/**
 * A session's standing, from its runs: anything still running wins, then a
 * failure, then a stop; all green is success; no runs at all is idle.
 */
function statusOf(runs: Run[]): WorkspaceSessionSummary['status'] {
  if (runs.length === 0) return 'idle';
  if (runs.some((run) => run.status === 'running')) return 'running';
  if (runs.some((run) => run.status === 'failure')) return 'failure';
  if (runs.some((run) => run.status === 'stopped')) return 'stopped';
  return 'success';
}

/**
 * The workspace's sessions with their runs folded in, most recently active
 * first. Sessions come from the API when it sends them; a run whose session
 * is not in that list still gets a row, so nothing a run points at is hidden.
 */
export function summariseSessions(
  workspace: Pick<Workspace, 'sessions' | 'runs'>,
): WorkspaceSessionSummary[] {
  const runs = workspace.runs ?? [];
  const sessions = new Map<string, Pick<Session, 'sessionId' | 'name' | 'createdAt'>>();

  for (const session of workspace.sessions ?? []) {
    sessions.set(session.sessionId, session);
  }
  for (const run of runs) {
    const session = run.session;
    if (session && !sessions.has(session.sessionId)) {
      sessions.set(session.sessionId, session);
    }
  }

  const runsBySession = new Map<string, Run[]>();
  for (const run of runs) {
    const list = runsBySession.get(run.sessionId) ?? [];
    list.push(run);
    runsBySession.set(run.sessionId, list);
  }

  const time = (value: string | null | undefined) => Date.parse(value ?? '') || 0;

  return Array.from(sessions.values())
    .map((session) => {
      const own = runsBySession.get(session.sessionId) ?? [];
      const lastRun = own.reduce<string | null>(
        (latest, run) => (time(run.startedAt) > time(latest) ? run.startedAt : latest),
        null,
      );
      return {
        sessionId: session.sessionId,
        name: session.name ?? null,
        status: statusOf(own),
        runCount: own.length,
        lastUsed: lastRun ?? session.createdAt,
      };
    })
    .sort((a, b) => time(b.lastUsed) - time(a.lastUsed));
}
