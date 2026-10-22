import { fireEvent, render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@app/ui/select';

function renderSelect(props: React.ComponentProps<typeof Select> = {}) {
  render(
    <Select {...props}>
      <SelectTrigger aria-label="Status">
        <SelectValue placeholder="Any status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Lifecycle</SelectLabel>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived" disabled>
            Archived
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
  return screen.getByRole('combobox', { name: 'Status' });
}

describe('Select', () => {
  it('shows the placeholder until a value is chosen', () => {
    const trigger = renderSelect();

    expect(trigger.textContent).toBe('Any status');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens from the keyboard into a listbox of the options', () => {
    const trigger = renderSelect();

    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Active',
      'Archived',
    ]);
    expect(
      screen
        .getByRole('option', { name: 'Archived' })
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('reports a chosen option, shows its label and closes', () => {
    const onValueChange = jest.fn();
    const trigger = renderSelect({ onValueChange });

    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(screen.getByRole('option', { name: 'Active' }));

    expect(onValueChange).toHaveBeenCalledWith('active');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger.textContent).toBe('Active');
  });

  it('renders a preselected value by its label, not its key', () => {
    const trigger = renderSelect({ defaultValue: 'active' });

    expect(trigger.textContent).toBe('Active');
  });
});
