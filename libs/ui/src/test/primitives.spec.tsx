import { fireEvent, render, screen } from '@testing-library/react';
import { Alert, Button, Chips, EmptyState } from '@app/ui';

describe('Button', () => {
  it('defaults to type=button so it never submits a form by accident', () => {
    const onSubmit = jest.fn((event: React.FormEvent) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
        <Button type="submit">Save</Button>
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Plain' }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('forwards onClick and disabled', () => {
    const onClick = jest.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('appends the caller className after the variant classes', () => {
    render(
      <Button variant="ghost" className="w-full">
        Go
      </Button>,
    );

    const classes = screen
      .getByRole('button', { name: 'Go' })
      .className.split(/\s+/);
    expect(classes[classes.length - 1]).toBe('w-full');
    expect(classes.indexOf('w-full')).toBeGreaterThan(
      classes.indexOf('text-gray-600'),
    );
  });
});

describe('Chips', () => {
  it('lists every label', () => {
    render(
      <Chips
        items={[
          { id: '1', label: 'Design' },
          { id: '2', label: 'Ops' },
        ]}
      />,
    );

    expect(screen.getByText('Design')).toBeTruthy();
    expect(screen.getByText('Ops')).toBeTruthy();
  });

  it('shows a dash for no items unless told otherwise', () => {
    const { rerender } = render(<Chips items={[]} />);
    expect(screen.getByText('—')).toBeTruthy();

    rerender(<Chips items={[]} emptyText="No tags" />);
    expect(screen.getByText('No tags')).toBeTruthy();
  });
});

describe('Alert', () => {
  it('is announced as an alert only for errors', () => {
    const { rerender } = render(<Alert variant="error">Save failed</Alert>);
    expect(screen.getByRole('alert').textContent).toBe('Save failed');

    rerender(<Alert variant="warning">Unsaved changes</Alert>);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders only the parts it is given', () => {
    const { rerender } = render(<EmptyState title="No items yet" />);
    expect(screen.getByText('No items yet')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <EmptyState
        title="No items yet"
        description="Create one to get started."
        action={<button type="button">New item</button>}
      />,
    );
    expect(screen.getByText('Create one to get started.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New item' })).toBeTruthy();
  });
});
