'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

// Fire-and-forget notifications. Deliberately not Radix: their toast is built around
// swipe gestures and per-toast markup, which is more machinery than "the save worked /
// the save failed" needs. Mount one ToastProvider near the app root; call
// `useToast()(message, { variant })` anywhere below it.
//
// Toasts render with role="status" so screen readers announce them and tests can
// find them by role or text.

export type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  variant?: ToastVariant;
  /** ms until auto-dismiss. Errors default to 8000, everything else to 4000. */
  duration?: number;
};

type ToastFn = (message: string, options?: ToastOptions) => void;

type ToastEntry = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used within a <ToastProvider>');
  return toast;
}

const variants: Record<ToastVariant, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-gray-200 bg-white text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, options = {}) => {
      const id = nextId.current++;
      const variant = options.variant ?? 'info';
      setToasts((current) => [...current, { id, message, variant }]);
      const duration = options.duration ?? (variant === 'error' ? 8000 : 4000);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  // The context value is the function itself, memoised so consumers do not re-render
  // when unrelated toasts come and go.
  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${variants[t.variant]}`}
          >
            <span className="min-w-0 break-words">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-4"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
