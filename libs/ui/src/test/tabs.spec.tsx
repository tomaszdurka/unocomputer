import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui/tabs';

function renderTabs(onValueChange?: (value: string) => void) {
  render(
    <Tabs defaultValue="details" onValueChange={onValueChange}>
      <TabsList aria-label="Item">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="details">Details panel</TabsContent>
      <TabsContent value="history">History panel</TabsContent>
    </Tabs>,
  );
}

describe('Tabs', () => {
  it('shows only the default panel and marks its tab selected', () => {
    renderTabs();

    expect(
      screen
        .getByRole('tab', { name: 'Details' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      screen
        .getByRole('tab', { name: 'History' })
        .getAttribute('aria-selected'),
    ).toBe('false');
    expect(screen.getByRole('tabpanel').textContent).toBe('Details panel');
  });

  it('switches panels on activation and reports the new value', () => {
    const onValueChange = jest.fn();
    renderTabs(onValueChange);

    // Radix activates a tab on mouse down (and on focus), not on click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'History' }));

    expect(onValueChange).toHaveBeenCalledWith('history');
    expect(screen.getByRole('tabpanel').textContent).toBe('History panel');
    expect(
      screen
        .getByRole('tab', { name: 'History' })
        .getAttribute('aria-selected'),
    ).toBe('true');
  });
});
