import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { SortableList } from '@app/ui/sortable-list';

// dnd-kit's keyboard sensor drives the same code path as pointer dragging and
// works in jsdom: focus a handle, Space picks the row up, arrows move it,
// Space drops it. Pointer dragging needs real layout, so it is not simulated.

type Row = { id: string; label: string };

const items: Row[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

function renderList(over: { handle?: boolean; disabled?: boolean } = {}) {
  const onReorder = jest.fn();
  render(
    <SortableList<Row>
      items={items}
      onReorder={onReorder}
      renderItem={(item) => <span>{item.label}</span>}
      {...over}
    />,
  );
  return { onReorder };
}

// jsdom has no layout, and dnd-kit decides where a row went from rectangles.
// Give every row a 40px slot in DOM order so "arrow down" has somewhere to go.
const ROW = 40;
const originalRect = HTMLElement.prototype.getBoundingClientRect;
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function () {
    const row = this.closest('[data-sortable-id]');
    const rows = Array.from(document.querySelectorAll('[data-sortable-id]'));
    const index = row ? rows.indexOf(row) : -1;
    const top = index < 0 ? 0 : index * ROW;
    const height = row ? ROW : rows.length * ROW;
    return {
      x: 0,
      y: top,
      top,
      bottom: top + height,
      left: 0,
      right: 200,
      width: 200,
      height,
      toJSON: () => ({}),
    } as DOMRect;
  };
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
});

// dnd-kit settles each step asynchronously; a key, then a tick.
async function press(target: HTMLElement, code: string, key: string) {
  await act(async () => {
    fireEvent.keyDown(target, { code, key });
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

describe('SortableList', () => {
  it('renders the rows in the order given, each with a drag handle', () => {
    renderList();
    const handles = screen.getAllByRole('button', { name: 'Drag to reorder' });
    expect(handles).toHaveLength(3);
    expect(
      screen
        .getByText('Alpha')
        .compareDocumentPosition(screen.getByText('Beta')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('reports the new order when a row is moved by keyboard, and leaves the move to the caller', async () => {
    const { onReorder } = renderList();
    const [first] = screen.getAllByRole('button', { name: 'Drag to reorder' });
    first.focus();
    await press(first, 'Space', ' ');
    await press(first, 'ArrowDown', 'ArrowDown');
    await press(first, 'Space', ' ');
    expect(onReorder).toHaveBeenCalledWith(['b', 'a', 'c']);
    // Controlled: nothing moved on screen until the caller re-renders with the new order.
    expect(
      screen
        .getByText('Alpha')
        .compareDocumentPosition(screen.getByText('Beta')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('does not report a drop in the same place', async () => {
    const { onReorder } = renderList();
    const [first] = screen.getAllByRole('button', { name: 'Drag to reorder' });
    first.focus();
    await press(first, 'Space', ' ');
    await press(first, 'Space', ' ');
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('disables every handle when disabled', () => {
    renderList({ disabled: true });
    for (const handle of screen.getAllByRole('button', {
      name: 'Drag to reorder',
    })) {
      expect((handle as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('renders no handle when the whole row drags', () => {
    renderList({ handle: false });
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder' }),
    ).toBeNull();
    expect(
      within(screen.getByText('Alpha').parentElement!).queryByRole('button'),
    ).toBeNull();
  });
});
