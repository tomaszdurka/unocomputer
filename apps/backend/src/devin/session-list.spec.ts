import { findDevinSessionId } from './session-list';

const dir = '/work/ws-1';
const row = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  short_id: id.slice(0, 8),
  working_directory: dir,
  last_activity_at: '2026-10-22T10:00:00Z',
  title: 'untitled',
  ...extra,
});

describe('findDevinSessionId', () => {
  it('prefers the session titled with our marker, whatever its age', () => {
    const rows = [
      row('newest', { last_activity_at: '2026-10-22T12:00:00Z' }),
      row('ours', { title: '[SESSION-ID=uno-1] fix the tests' }),
    ];
    expect(findDevinSessionId(rows, 'uno-1', dir)).toBe('ours');
  });

  it('falls back to the most recent session in the folder', () => {
    const rows = [
      row('older', { last_activity_at: '2026-10-22T09:00:00Z' }),
      row('newer', { last_activity_at: '2026-10-22T11:00:00Z' }),
    ];
    expect(findDevinSessionId(rows, 'uno-1', dir)).toBe('newer');
  });

  it('ignores sessions from another folder', () => {
    const rows = [
      row('elsewhere', {
        working_directory: '/work/other',
        last_activity_at: '2026-10-22T23:00:00Z',
      }),
      row('here'),
    ];
    expect(findDevinSessionId(rows, 'uno-1', dir)).toBe('here');
  });

  it('answers null for no sessions, or for output that is not a list', () => {
    expect(findDevinSessionId([], 'uno-1', dir)).toBeNull();
    expect(findDevinSessionId({ error: 'x' }, 'uno-1', dir)).toBeNull();
    expect(findDevinSessionId(null, 'uno-1', dir)).toBeNull();
  });

  it('skips rows without a string id', () => {
    expect(
      findDevinSessionId([{ title: 'x' }, { id: 42 }], 'uno-1', dir),
    ).toBeNull();
  });
});
