import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from '@app/ui';

// Pages are 1-based, matching the paginated DTOs the backend emits. The range text
// uses an en dash ("1–10"), so the assertions spell it as an escape.
function shown(): string {
  return screen.getByText(/^Showing/).textContent ?? '';
}

describe('Pagination', () => {
  it('describes the first page as the first slice of the total', () => {
    render(
      <Pagination page={1} pageSize={10} total={42} onPageChange={jest.fn()} />,
    );

    expect(shown()).toBe('Showing 1–10 of 42');
  });

  it('ends a partial last page at the total, not the page boundary', () => {
    render(
      <Pagination page={5} pageSize={10} total={42} onPageChange={jest.fn()} />,
    );

    expect(shown()).toBe('Showing 41–42 of 42');
  });

  it('shows 0-0 of 0 rather than 1-0 for an empty list', () => {
    render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={jest.fn()} />,
    );

    expect(shown()).toBe('Showing 0–0 of 0');
    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('disables Previous on the first page only', () => {
    render(
      <Pagination page={1} pageSize={10} total={42} onPageChange={jest.fn()} />,
    );

    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('disables Next on the last page, including when the total divides evenly', () => {
    const { rerender } = render(
      <Pagination page={5} pageSize={10} total={42} onPageChange={jest.fn()} />,
    );
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    // 20 of 10 is exactly two pages; a naive `total / pageSize + 1` would allow page 3.
    rerender(
      <Pagination page={2} pageSize={10} total={20} onPageChange={jest.fn()} />,
    );
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('enables both directions on a middle page', () => {
    render(
      <Pagination page={3} pageSize={10} total={42} onPageChange={jest.fn()} />,
    );

    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('reports the neighbouring page number, not a delta', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        page={3}
        pageSize={10}
        total={42}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(onPageChange.mock.calls).toEqual([[4], [2]]);
  });
});
