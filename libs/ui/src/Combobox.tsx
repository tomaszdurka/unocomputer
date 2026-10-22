'use client';

import { useId, useRef, useState } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from './Popover';
import { fieldClasses } from './Field';

// A text input with a filtered suggestion list - what MUI calls an Autocomplete.
// Built on the kit's Popover so the list renders in a portal (it escapes
// overflow-hidden dialogs) while the input keeps focus the whole time.
//
// The value is plain text. With `allowCustom` the user may type anything; without it
// the caller should validate on submit - the component never silently rewrites input.

export type ComboboxOption = {
  value: string;
  /** Shown in the list (and matched against) instead of `value` when present. */
  label?: string;
  /** Dimmed second line in the list. */
  description?: string;
};

type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Free text is a valid value, not just a filter. Affects nothing visually. */
  allowCustom?: boolean;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  allowCustom = false,
  emptyText = 'No matches',
  disabled = false,
  id,
  className = '',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const query = value.trim().toLowerCase();
  const exactMatch = options.some(
    (o) => (o.label ?? o.value).toLowerCase() === query,
  );
  // After picking an option the input holds its full text; filtering by it would
  // strand the user with a one-item list, so an exact match shows everything again.
  const filtered =
    query && !exactMatch
      ? options.filter((o) =>
          `${o.label ?? ''} ${o.value}`.toLowerCase().includes(query),
        )
      : options;

  const select = (option: ComboboxOption) => {
    onValueChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      setHighlighted(0);
      event.preventDefault();
      return;
    }
    if (!open) return;

    if (event.key === 'ArrowDown') {
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      setHighlighted((i) => Math.max(i - 1, 0));
      event.preventDefault();
    } else if (event.key === 'Enter') {
      if (filtered[highlighted]) {
        select(filtered[highlighted]);
        event.preventDefault();
      } else if (allowCustom) {
        setOpen(false);
      }
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${fieldClasses} ${className}`}
        />
      </PopoverAnchor>
      <PopoverContent
        // The input keeps focus; the list is pointer/arrow-key territory only.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault();
        }}
        className="max-h-72 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1"
        // Inside a modal dialog the scroll lock swallows wheel events that land
        // outside the dialog's own tree - and this list is portalled outside it.
        // Scroll it by hand, so a long list is reachable from within a dialog.
        onWheel={(event) => {
          event.currentTarget.scrollTop += event.deltaY;
        }}
      >
        <ul id={listboxId} role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 dark:text-neutral-500">
              {emptyText}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                // Arrowing past the visible rows brings the highlighted one into view.
                ref={
                  index === highlighted
                    ? (node) => node?.scrollIntoView({ block: 'nearest' })
                    : undefined
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
                onMouseEnter={() => setHighlighted(index)}
                className={`cursor-default select-none rounded-lg px-3 py-2 text-sm ${
                  index === highlighted ? 'bg-gray-100 dark:bg-neutral-800' : ''
                }`}
              >
                <div className="truncate">{option.label ?? option.value}</div>
                {option.description ? (
                  <div className="truncate text-xs text-gray-500 dark:text-neutral-400">
                    {option.description}
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
