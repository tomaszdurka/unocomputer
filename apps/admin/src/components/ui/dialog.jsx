"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "#/lib/utils"

const Dialog = ({ open, onOpenChange, children, className }) => {
  // Escape to dismiss. This dialog is hand-rolled rather than Radix, so it still lacks
  // a focus trap and scroll lock - see components/ui/dialog.jsx in the backlog.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    {children}
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 dark:text-neutral-500 transition hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-neutral-100"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-b border-gray-200 dark:border-neutral-800 px-6 py-4", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogBody = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-y-auto p-6", className)}
    {...props}
  />
));
DialogBody.displayName = "DialogBody";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody };
