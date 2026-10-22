import { fireEvent, render, screen } from '@testing-library/react';
import { Input, Label, LinkPicker } from '@app/ui';
import { Checkbox } from '@app/ui/checkbox';
import { Switch } from '@app/ui/switch';

describe('Checkbox', () => {
  it('toggles its checked state and reports it', () => {
    const onCheckedChange = jest.fn();
    render(
      <Checkbox aria-label="Archived" onCheckedChange={onCheckedChange} />,
    );

    const box = screen.getByRole('checkbox', { name: 'Archived' });
    expect(box.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(box);

    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('ignores clicks while disabled', () => {
    const onCheckedChange = jest.fn();
    render(
      <Checkbox
        aria-label="Archived"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Archived' }));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('checkbox', { name: 'Archived' })
        .getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('defers to the controlled value', () => {
    const onCheckedChange = jest.fn();
    render(
      <Checkbox
        aria-label="Archived"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Archived' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(
      screen
        .getByRole('checkbox', { name: 'Archived' })
        .getAttribute('aria-checked'),
    ).toBe('false');
  });
});

describe('Switch', () => {
  it('is a switch that flips on click', () => {
    const onCheckedChange = jest.fn();
    render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe('Field', () => {
  it('pairs Label and Input through htmlFor and forwards input props', () => {
    const onChange = jest.fn();
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Untitled" value="" onChange={onChange} />
      </>,
    );

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.placeholder).toBe('Untitled');

    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('LinkPicker', () => {
  const options = [
    { id: 'a', label: 'Acme' },
    { id: 'b', label: 'Bolt' },
  ];

  it('checks the linked options and reports toggles by id', () => {
    const onToggle = jest.fn();
    render(
      <LinkPicker
        label="Companies"
        options={options}
        selectedIds={['b']}
        onToggle={onToggle}
        emptyText="No companies yet"
      />,
    );

    expect((screen.getByLabelText('Acme') as HTMLInputElement).checked).toBe(
      false,
    );
    expect((screen.getByLabelText('Bolt') as HTMLInputElement).checked).toBe(
      true,
    );

    fireEvent.click(screen.getByLabelText('Acme'));
    expect(onToggle).toHaveBeenCalledWith('a');
  });

  it('shows the empty text instead of an empty list', () => {
    render(
      <LinkPicker
        label="Companies"
        options={[]}
        selectedIds={[]}
        onToggle={jest.fn()}
        emptyText="No companies yet"
      />,
    );

    expect(screen.getByText('No companies yet')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
