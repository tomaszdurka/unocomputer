'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
// Radix gives this a focus trap, aria-modal wiring, Escape-to-close, scroll lock and
// restore-focus-on-close. Hand-rolling an overlay gets the look but none of that, so
// reach for these rather than a bare fixed-position div.
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ title, srTitle = false, description, children, className = '', ...props }) {
    return (<DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50"/>
      <DialogPrimitive.Content className={`fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 ${className}`} {...props}>
        <div className="border-b border-gray-200 px-6 py-4 dark:border-neutral-800">
          <DialogPrimitive.Title className={srTitle ? 'sr-only' : 'text-base font-semibold tracking-tight'}>
            {title}
          </DialogPrimitive.Title>
          {description ? (<DialogPrimitive.Description className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              {description}
            </DialogPrimitive.Description>) : null}
        </div>

        <div className="px-6 py-4">{children}</div>

        <DialogPrimitive.Close aria-label="Close" className="absolute right-4 top-3.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden="true">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>);
}
export function DialogFooter({ children }) {
    return <div className="flex justify-end gap-2 pt-2">{children}</div>;
}
