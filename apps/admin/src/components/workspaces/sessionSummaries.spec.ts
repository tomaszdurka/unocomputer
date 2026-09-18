import { summariseSessions } from './sessionSummaries';
import type { Run, Session } from '#/lib/types';

const session = (over: Partial<Session> = {}): Session => ({
  sessionId: 's1',
  name: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  workspaceId: 'w1',
  ...over,
});

const run = (over: Partial<Run> = {}): Run => ({
  runId: 'r1',
  prompt: 'p',
  model: null,
  status: 'success',
  exitCode: 0,
  startedAt: '2026-01-02T00:00:00Z',
  completedAt: null,
  lastHeartbeat: null,
  sessionId: 's1',
  workspaceId: 'w1',
  ...over,
});

describe('summariseSessions', () => {
  it('lists a session that has no run yet as idle, dated by its creation', () => {
    const [row] = summariseSessions({ sessions: [session({ name: 'fresh' })], runs: [] });
    expect(row).toEqual({
      sessionId: 's1',
      name: 'fresh',
      status: 'idle',
      runCount: 0,
      lastUsed: '2026-01-01T00:00:00Z',
    });
  });

  it('folds runs in: count, latest start, and the most urgent status', () => {
    const rows = summariseSessions({
      sessions: [session()],
      runs: [
        run({ runId: 'r1', status: 'success', startedAt: '2026-01-02T00:00:00Z' }),
        run({ runId: 'r2', status: 'failure', startedAt: '2026-01-03T00:00:00Z' }),
        run({ runId: 'r3', status: 'running', startedAt: '2026-01-01T12:00:00Z' }),
      ],
    });
    expect(rows[0]).toMatchObject({ status: 'running', runCount: 3, lastUsed: '2026-01-03T00:00:00Z' });
  });

  it('ranks failure above stopped above success', () => {
    const rows = (statuses: Run['status'][]) =>
      summariseSessions({
        sessions: [session()],
        runs: statuses.map((status, i) => run({ runId: `r${i}`, status })),
      })[0].status;
    expect(rows(['success', 'stopped'])).toBe('stopped');
    expect(rows(['stopped', 'failure'])).toBe('failure');
    expect(rows(['success', 'success'])).toBe('success');
  });

  it('still shows a session the API only sent through a run', () => {
    const rows = summariseSessions({
      sessions: undefined,
      runs: [run({ session: session({ sessionId: 's9', name: 'via-run' }), sessionId: 's9' })],
    });
    expect(rows).toEqual([expect.objectContaining({ sessionId: 's9', name: 'via-run', runCount: 1 })]);
  });

  it('puts the most recently active session first', () => {
    const rows = summariseSessions({
      sessions: [
        session({ sessionId: 'old', createdAt: '2026-01-01T00:00:00Z' }),
        session({ sessionId: 'new', createdAt: '2026-01-05T00:00:00Z' }),
      ],
      runs: [run({ sessionId: 'old', startedAt: '2026-01-03T00:00:00Z' })],
    });
    expect(rows.map((row) => row.sessionId)).toEqual(['new', 'old']);
  });
});
