import { fireEvent, render, screen } from '@testing-library/react';
import { ToggleGroup, ToggleGroupItem } from '@app/ui/toggle-group';

describe('ToggleGroup', () => {
  it('in single mode behaves as a radio group with one pressed segment', () => {
    const onValueChange = jest.fn();
    render(
      <ToggleGroup
        type="single"
        defaultValue="list"
        onValueChange={onValueChange}
        aria-label="Layout"
      >
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(
      screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));

    expect(onValueChange).toHaveBeenCalledWith('grid');
    expect(
      screen.getByRole('radio', { name: 'Grid' }).getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      screen.getByRole('radio', { name: 'List' }).getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('in multiple mode lets several segments be pressed', () => {
    const onValueChange = jest.fn();
    render(
      <ToggleGroup
        type="multiple"
        defaultValue={['bold']}
        onValueChange={onValueChange}
        aria-label="Style"
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));

    expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic']);
    expect(
      screen.getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: 'Italic' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
