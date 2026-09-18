import { render, screen } from '@testing-library/react';
import SessionsListView from './SessionsListView';
import type { Session } from '#/lib/types';

const session = (over: Partial<Session> = {}): Session => ({
  sessionId: 's1',
  name: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  workspaceId: 'w1',
  workspace: {
    workspaceId: 'w1',
    workingDir: '/repo',
    name: 'Repo',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  runs: [],
  ...over,
});

describe('SessionsListView', () => {
  it('shows the name with the id beneath, and "Unnamed" when there is none', () => {
    render(
      <SessionsListView
        sessions={[session({ sessionId: 'named', name: 'implement-login' }), session({ sessionId: 'bare' })]}
      />,
    );
    expect(screen.getByText('implement-login')).toBeTruthy();
    expect(screen.getByText('named')).toBeTruthy();
    expect(screen.getByText('Unnamed')).toBeTruthy();
    expect(screen.getByText('bare')).toBeTruthy();
  });

  it('links each row to its session and its workspace', () => {
    render(<SessionsListView sessions={[session({ sessionId: 's1', name: 'x' })]} />);
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toContain('/sessions/s1');
    expect(links).toContain('/workspaces/w1');
  });
});
