import { fireEvent, render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/dropdown-menu';

function renderMenu(onSelect = jest.fn()) {
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button">More</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  return screen.getByRole('button', { name: 'More' });
}

describe('DropdownMenu', () => {
  it('opens a menu of items from the trigger', () => {
    const trigger = renderMenu();
    expect(screen.queryByRole('menu')).toBeNull();

    // jsdom has no real pointer events; the keyboard path is the one it can drive.
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getByRole('menu')).toBeTruthy();
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Edit', 'Delete']);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('runs the item action and closes', () => {
    const onSelect = jest.fn();
    const trigger = renderMenu(onSelect);
    fireEvent.keyDown(trigger, { key: 'Enter' });

    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
