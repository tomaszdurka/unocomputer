import { fireEvent, render, screen } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from '@app/ui/popover';

function renderPopover() {
  render(
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">Filters</button>
      </PopoverTrigger>
      <PopoverContent>
        <label>
          Owner <input />
        </label>
      </PopoverContent>
    </Popover>,
  );
  return screen.getByRole('button', { name: 'Filters' });
}

describe('Popover', () => {
  it('opens from its trigger and reports the state on it', () => {
    const trigger = renderPopover();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByLabelText('Owner')).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText('Owner')).toBeTruthy();
  });

  it('dismisses on Escape', () => {
    const trigger = renderPopover();
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByLabelText('Owner'), { key: 'Escape' });

    expect(screen.queryByLabelText('Owner')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
