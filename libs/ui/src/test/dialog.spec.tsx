import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@app/ui/dialog';

function renderDialog(
  props: Partial<React.ComponentProps<typeof DialogContent>> = {},
) {
  return render(
    <Dialog>
      <DialogTrigger asChild>
        <button type="button">Open</button>
      </DialogTrigger>
      <DialogContent title="Rename item" {...props}>
        <input aria-label="Name" />
      </DialogContent>
    </Dialog>,
  );
}

describe('Dialog', () => {
  it('stays out of the DOM until its trigger opens it', () => {
    renderDialog();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Rename item' })).toBeTruthy();
  });

  it('wires the description into the dialog for assistive tech', () => {
    renderDialog({ description: 'Pick something memorable.' });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      'Pick something memorable.',
    );
  });

  it('keeps a visually hidden title as the accessible name', () => {
    renderDialog({ srTitle: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Rename item' })).toBeTruthy();
    expect(screen.getByText('Rename item').className).toContain('sr-only');
  });

  it('closes from the corner button and from Escape', () => {
    renderDialog();
    const open = screen.getByRole('button', { name: 'Open' });

    fireEvent.click(open);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(open);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ConfirmDialog', () => {
  function renderConfirm(
    onConfirm: () => void | Promise<void>,
    onOpenChange = jest.fn(),
  ) {
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete project?"
        description="This cannot be undone."
        confirmLabel="Delete project"
        destructive
        onConfirm={onConfirm}
      />,
    );
    return onOpenChange;
  }

  it('closes once the confirmation has run', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onOpenChange = renderConfirm(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('stays open and shows the message when the confirmation rejects', async () => {
    const onOpenChange = renderConfirm(() =>
      Promise.reject(new Error('Still referenced by 3 runs')),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));

    expect(await screen.findByText('Still referenced by 3 runs')).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Delete project?' }),
    ).toBeTruthy();
  });

  it('locks both buttons while the confirmation is in flight', async () => {
    let settle: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      settle = resolve;
    });
    renderConfirm(() => pending);

    const confirm = screen.getByRole('button', {
      name: 'Delete project',
    }) as HTMLButtonElement;
    const cancel = screen.getByRole('button', {
      name: 'Cancel',
    }) as HTMLButtonElement;

    fireEvent.click(confirm);
    expect(confirm.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);

    await act(async () => {
      settle();
      await pending;
    });
    expect(confirm.disabled).toBe(false);
  });

  it('cancels without running the confirmation', () => {
    const onConfirm = jest.fn();
    const onOpenChange = renderConfirm(onConfirm);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
