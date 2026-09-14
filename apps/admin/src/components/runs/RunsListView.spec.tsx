import { render, screen, within } from '@testing-library/react';
import RunsListView from './RunsListView';
import type { Run } from '#/lib/types';

// Covers the bits of the runs list that have actually broken before: elapsed formatting,
// the status badge mapping (which silently emitted no CSS when `rose`/`amber` collided
// with Tailwind's scales), newest-first ordering, and the whole-row link that DataTable
// builds from rowHref.

const run = (over: Partial<Run> = {}): Run => ({
  runId: 'r1',
  prompt: 'do a thing',
  model: 'claude',
  status: 'success',
  exitCode: 0,
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:00:18.000Z',
  lastHeartbeat: null,
  sessionId: 's1',
  workspaceId: 'w1',
  ...over,
});

describe('RunsListView', () => {
  it('renders one row per run with the run id under the prompt', () => {
    render(<RunsListView runs={[run()]} />);

    expect(screen.getByText('do a thing')).toBeDefined();
    expect(screen.getByText('r1')).toBeDefined();
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + 1
  });

  it('labels the caption with the run count', () => {
    render(<RunsListView runs={[run(), run({ runId: 'r2' })]} />);
    expect(screen.getByText('Recent Runs (2)')).toBeDefined();
  });

  it('formats elapsed time from start and completion', () => {
    render(<RunsListView runs={[run()]} />);
    expect(screen.getByText('18s')).toBeDefined();
  });

  it('shows runs that have not finished as running', () => {
    render(<RunsListView runs={[run({ completedAt: null })]} />);
    expect(screen.getByText('running...')).toBeDefined();
  });

  it('orders newest first regardless of input order', () => {
    render(
      <RunsListView
        runs={[
          run({ runId: 'old', prompt: 'older', startedAt: '2026-01-01T00:00:00.000Z' }),
          run({ runId: 'new', prompt: 'newer', startedAt: '2026-06-01T00:00:00.000Z' }),
        ]}
      />,
    );
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('newer')).toBeDefined();
    expect(within(rows[1]).getByText('older')).toBeDefined();
  });

  it.each([
    ['success', 'emerald'],
    ['failure', 'rose'],
    ['stopped', 'amber'],
    ['running', 'blue'],
  ] as const)('gives %s runs a %s badge that actually carries colour classes', (status, hue) => {
    render(<RunsListView runs={[run({ status, completedAt: null })]} />);
    const badge = screen.getByText(status);
    // Guards the regression where a colour existed in markup but emitted no CSS.
    expect(badge.className).toContain(`${hue}-`);
    expect(badge.className).toContain('dark:');
  });

  it('links each row to its run', () => {
    render(<RunsListView runs={[run()]} />);
    const link = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/runs/r1');
    expect(link).toBeDefined();
  });

  it('shows an empty state rather than a bare table', () => {
    render(<RunsListView runs={[]} />);
    expect(screen.getByText(/No runs yet/i)).toBeDefined();
  });
});
