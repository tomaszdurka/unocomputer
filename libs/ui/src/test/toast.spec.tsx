import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast, type ToastVariant } from '@app/ui/toast';

function Notifier({
  message,
  variant,
  duration,
}: {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast(message, { variant, duration })}>
      notify {message}
    </button>
  );
}

function renderNotifier(props: React.ComponentProps<typeof Notifier>) {
  render(
    <ToastProvider>
      <Notifier {...props} />
    </ToastProvider>,
  );
  return () =>
    fireEvent.click(
      screen.getByRole('button', { name: `notify ${props.message}` }),
    );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useToast', () => {
  it('refuses to run outside a ToastProvider', () => {
    // React reports the throw on console.error as well; keep the output clean.
    const silence = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<Notifier message="x" />)).toThrow(
        'useToast must be used within a <ToastProvider>',
      );
    } finally {
      silence.mockRestore();
    }
  });
});

describe('ToastProvider', () => {
  it('announces each message as a status and stacks them in order', () => {
    const notify = renderNotifier({ message: 'Saved' });

    notify();
    notify();

    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0].textContent).toContain('Saved');
  });

  it('is dismissable by hand', () => {
    const notify = renderNotifier({ message: 'Saved' });
    notify();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('auto-dismisses after four seconds by default', () => {
    const notify = renderNotifier({ message: 'Saved' });
    notify();

    act(() => jest.advanceTimersByTime(3999));
    expect(screen.getByRole('status')).toBeTruthy();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps errors on screen twice as long', () => {
    const notify = renderNotifier({ message: 'Save failed', variant: 'error' });
    notify();

    act(() => jest.advanceTimersByTime(7999));
    expect(screen.getByRole('status')).toBeTruthy();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('honours an explicit duration over the variant default', () => {
    const notify = renderNotifier({
      message: 'Save failed',
      variant: 'error',
      duration: 500,
    });
    notify();

    act(() => jest.advanceTimersByTime(500));

    expect(screen.queryByRole('status')).toBeNull();
  });
});
