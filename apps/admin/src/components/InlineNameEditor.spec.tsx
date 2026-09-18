import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InlineNameEditor from './InlineNameEditor';

describe('InlineNameEditor', () => {
  it('shows the name, or the empty label in its place', () => {
    const { rerender } = render(
      <InlineNameEditor value="Alpha" emptyLabel="Unnamed" placeholder="Name" onSave={jest.fn()} />,
    );
    expect((screen.getByRole('heading')).textContent).toContain('Alpha');

    rerender(<InlineNameEditor value={null} emptyLabel="Unnamed" placeholder="Name" onSave={jest.fn()} />);
    expect((screen.getByRole('heading')).textContent).toContain('Unnamed');
  });

  it('saves the trimmed name on Enter and shows it', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<InlineNameEditor value="Alpha" emptyLabel="Unnamed" placeholder="Name" onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('Edit name'));
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: '  Renamed  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Renamed'));
    expect((await screen.findByRole('heading')).textContent).toContain('Renamed');
  });

  it('saves null when the name is cleared', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<InlineNameEditor value="Alpha" emptyLabel="Unnamed" placeholder="Name" onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('Edit name'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByLabelText('Save name'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
    expect((await screen.findByRole('heading')).textContent).toContain('Unnamed');
  });

  it('drops the edit on Escape', () => {
    const onSave = jest.fn();
    render(<InlineNameEditor value="Alpha" emptyLabel="Unnamed" placeholder="Name" onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('Edit name'));
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onSave).not.toHaveBeenCalled();
    expect((screen.getByRole('heading')).textContent).toContain('Alpha');
  });

  it('keeps editing and shows the message when saving fails', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Session s1 not found'));
    render(<InlineNameEditor value="Alpha" emptyLabel="Unnamed" placeholder="Name" onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('Edit name'));
    fireEvent.click(screen.getByLabelText('Save name'));

    expect(await screen.findByText('Session s1 not found')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });
});
