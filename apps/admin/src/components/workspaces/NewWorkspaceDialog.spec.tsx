import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewWorkspaceDialog from './NewWorkspaceDialog';
import { createWorkspace } from '#/lib/api';
import { routerMock } from '#/test/setup';

jest.mock('#/lib/api', () => ({ createWorkspace: jest.fn() }));

const create = jest.mocked(createWorkspace);

describe('NewWorkspaceDialog', () => {
  beforeEach(() => {
    create.mockReset();
    routerMock.push.mockReset();
  });

  it('binds a workspace to the folder typed in and opens it', async () => {
    create.mockResolvedValue({ workspaceId: 'w1' } as never);
    const onOpenChange = jest.fn();
    render(<NewWorkspaceDialog open onOpenChange={onOpenChange} />);

    fireEvent.change(screen.getByLabelText('Folder'), { target: { value: ' /Users/me/app ' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'App' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ directory: '/Users/me/app', name: 'App' }));
    expect(routerMock.push).toHaveBeenCalledWith('/workspaces/w1');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('asks for a managed workspace when both fields are empty', async () => {
    create.mockResolvedValue({ workspaceId: 'w2' } as never);
    render(<NewWorkspaceDialog open onOpenChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ directory: undefined, name: undefined }));
  });

  it('shows what the backend objected to and stays open', async () => {
    create.mockRejectedValue(new Error('directory does not exist: /nope'));
    const onOpenChange = jest.fn();
    render(<NewWorkspaceDialog open onOpenChange={onOpenChange} />);

    fireEvent.change(screen.getByLabelText('Folder'), { target: { value: '/nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('directory does not exist: /nope')).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
