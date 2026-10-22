'use client';

import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Radix gives this a focus trap, aria-modal wiring, Escape-to-close, scroll lock and
// restore-focus-on-close. Hand-rolling an overlay gets the look but none of that, so
// reach for these rather than a bare fixed-position div.

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  /** Accessible name. Required - Radix warns without it. Pass `srTitle` to hide it visually. */
  title: string;
  srTitle?: boolean;
  description?: string;
};

export function DialogContent({
  title,
  srTitle = false,
  description,
  children,
  className = '',
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
        {...props}
      >
        <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-800">
          <DialogPrimitive.Title
            className={
              srTitle ? 'sr-only' : 'text-base font-semibold tracking-tight'
            }
          >
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>

        <div className="px-6 py-4">{children}</div>

        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-4 top-3.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-2">{children}</div>;
}

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Confirm button label. Say what happens: "Delete project", not "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** May throw or reject: the dialog stays open and shows the message. */
  onConfirm: () => void | Promise<void>;
};

/**
 * The standard "are you sure" flow. A rejected `onConfirm` keeps the dialog open with
 * the error shown, so a failed delete never looks like it worked.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          setError(null);
          onOpenChange(next);
        }
      }}
    >
      <DialogContent
        title={title}
        description={description}
        className="max-w-md"
      >
        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                : 'bg-[var(--ui-accent)] text-[var(--ui-accent-fg)] hover:bg-[var(--ui-accent-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
