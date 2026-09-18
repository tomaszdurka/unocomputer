import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewSessionDialog from './NewSessionDialog';
import { createSession } from '#/lib/api';
import { routerMock } from '#/test/setup';

jest.mock('#/lib/api', () => ({ createSession: jest.fn() }));

const create = jest.mocked(createSession);

describe('NewSessionDialog', () => {
  beforeEach(() => {
    create.mockReset();
    routerMock.push.mockReset();
  });

  it('creates a named session in the workspace and opens it', async () => {
    create.mockResolvedValue({ sessionId: 's1' } as never);
    const onOpenChange = jest.fn();
    render(<NewSessionDialog open onOpenChange={onOpenChange} workspaceId="w1" />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'first' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ workspaceId: 'w1', name: 'first' }));
    expect(routerMock.push).toHaveBeenCalledWith('/sessions/s1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('leaves the name out when none was typed', async () => {
    create.mockResolvedValue({ sessionId: 's2' } as never);
    render(<NewSessionDialog open onOpenChange={jest.fn()} workspaceId="w1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ workspaceId: 'w1', name: undefined }));
  });

  it('shows the backend message when creation fails', async () => {
    create.mockRejectedValue(new Error('Workspace w1 not found'));
    render(<NewSessionDialog open onOpenChange={jest.fn()} workspaceId="w1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Workspace w1 not found')).toBeTruthy();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
