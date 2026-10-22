import { fireEvent, render, screen, within } from '@testing-library/react';
import { DataTable, type Column } from '@app/ui';

// Row navigation goes through the App Router, which is not mounted in jsdom; the
// push spy stands in for it.
const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

type Item = { id: string; name: string; status: string };

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name', cell: (row) => row.name },
  { key: 'status', header: 'Status', cell: (row) => <em>{row.status}</em> },
];

const rows: Item[] = [
  { id: '1', name: 'Alpha', status: 'active' },
  { id: '2', name: 'Beta', status: 'archived' },
];

const rowKey = (row: Item) => row.id;

beforeEach(() => push.mockClear());

describe('DataTable', () => {
  it('is a real table: one column header per column, one body row per record', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={rowKey} />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((th) => th.textContent)).toEqual(['Name', 'Status']);

    const body = screen.getAllByRole('rowgroup')[1];
    const bodyRows = within(body).getAllByRole('row');
    expect(bodyRows).toHaveLength(2);
    expect(within(bodyRows[1]).getByText('Beta')).toBeTruthy();
    // Cells render whatever the column's `cell` returns, markup included.
    expect(within(bodyRows[1]).getByText('archived').tagName).toBe('EM');
  });

  it('fills the body with a single full-width empty row when there is nothing to show', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={rowKey} />);

    const cell = screen.getByText('Nothing to show yet.');
    expect(cell.tagName).toBe('TD');
    expect((cell as HTMLTableCellElement).colSpan).toBe(2);
  });

  it('lets the caller replace the empty message', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={rowKey}
        empty={<button type="button">Create the first one</button>}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Create the first one' }),
    ).toBeTruthy();
    expect(screen.queryByText('Nothing to show yet.')).toBeNull();
  });

  it('starts at the header row unless a title asks for a caption strip', () => {
    const { rerender } = render(
      <DataTable columns={columns} rows={rows} rowKey={rowKey} />,
    );
    expect(screen.queryByRole('heading')).toBeNull();

    rerender(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        title="Items"
        headerActions={<button type="button">New</button>}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Items' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy();
  });

  it('renders the footer slot inside the same box', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        footer={<nav>pager</nav>}
      />,
    );

    expect(screen.getByRole('navigation').textContent).toBe('pager');
  });

  it('wraps only the first cell in a link when rows navigate', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        rowHref={(row) => `/items/${row.id}`}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/items/1',
      '/items/2',
    ]);
    expect(links[0].textContent).toBe('Alpha');
    // The status cell is plain content: middle-click and new-tab come from the link alone.
    expect(screen.getByText('archived').closest('a')).toBeNull();
  });

  it('navigates when any other cell in the row is clicked', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        rowHref={(row) => `/items/${row.id}`}
      />,
    );

    fireEvent.click(screen.getByText('archived'));

    expect(push).toHaveBeenCalledWith('/items/2');
  });

  it('leaves rows inert without rowHref so cell-level links own the click', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={rowKey} />);

    fireEvent.click(screen.getByText('archived'));

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it('switches to fixed layout with a colgroup once any column declares a width', () => {
    const { container, rerender } = render(
      <DataTable columns={columns} rows={rows} rowKey={rowKey} />,
    );
    expect(container.querySelector('colgroup')).toBeNull();
    expect(container.querySelector('table')?.className).not.toContain(
      'table-fixed',
    );

    rerender(
      <DataTable
        columns={[{ ...columns[0], width: '200px' }, columns[1]]}
        rows={rows}
        rowKey={rowKey}
      />,
    );
    const cols = container.querySelectorAll('col');
    expect(cols).toHaveLength(2);
    expect((cols[0] as HTMLElement).style.width).toBe('200px');
    expect(container.querySelector('table')?.className).toContain(
      'table-fixed',
    );
  });
});
