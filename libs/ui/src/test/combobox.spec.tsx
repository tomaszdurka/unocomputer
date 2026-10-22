import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Combobox, type ComboboxOption } from '@app/ui/combobox';

const options: ComboboxOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Engineering' },
  { value: 'grace', label: 'Grace Hopper', description: 'Engineering' },
  { value: 'tim', label: 'Tim Berners-Lee' },
];

// The component is controlled; this harness is the form around it, recording what
// it is told while keeping the input in sync.
function Harness({ initial = '', allowCustom = false, onChange = jest.fn() }) {
  const [value, setValue] = useState(initial);
  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(next) => {
        onChange(next);
        setValue(next);
      }}
      placeholder="Owner"
      allowCustom={allowCustom}
      emptyText="Nobody matches"
    />
  );
}

function input(): HTMLInputElement {
  return screen.getByRole('combobox') as HTMLInputElement;
}

describe('Combobox', () => {
  it('opens the full list on focus', () => {
    render(<Harness />);
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.focus(input());

    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('filters by label and value as the user types, case-insensitively', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: 'GRA' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Grace HopperEngineering',
    ]);

    fireEvent.change(input(), { target: { value: 'tim' } });
    expect(screen.getByRole('option').textContent).toBe('Tim Berners-Lee');
  });

  it('says so when nothing matches', () => {
    render(<Harness />);

    fireEvent.change(input(), { target: { value: 'zzz' } });

    expect(screen.queryByRole('option')).toBeNull();
    expect(screen.getByText('Nobody matches')).toBeTruthy();
  });

  it('picks an option by click, reporting its value and closing the list', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.focus(input());

    fireEvent.click(screen.getByRole('option', { name: /Grace Hopper/ }));

    expect(onChange).toHaveBeenLastCalledWith('grace');
    expect(input().value).toBe('grace');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('picks the highlighted option with the arrow keys and Enter', () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);

    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(onChange).toHaveBeenLastCalledWith('grace');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows the whole list again once the input holds an exact match', () => {
    render(<Harness initial="Ada Lovelace" />);

    fireEvent.focus(input());

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(
      screen
        .getByRole('option', { name: /Ada Lovelace/ })
        .getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('closes on Escape without touching the value', () => {
    const onChange = jest.fn();
    render(<Harness initial="gr" onChange={onChange} />);
    fireEvent.focus(input());

    fireEvent.keyDown(input(), { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(input().value).toBe('gr');
  });
});
