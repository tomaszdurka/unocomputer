'use client';

import { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';
import { Input } from '@app/ui';

type InlineNameEditorProps = {
  value: string | null;
  /** Shown in place of a missing name, e.g. "Unnamed Workspace". */
  emptyLabel: string;
  placeholder: string;
  /** Called with the trimmed name, or null when it was cleared. */
  onSave: (name: string | null) => Promise<void>;
};

/**
 * A heading that turns into an input on the pencil. Enter saves, Escape
 * cancels, and a failed save says so where the person is looking rather than
 * in the console.
 */
export default function InlineNameEditor({ value, emptyLabel, placeholder, onSave }: InlineNameEditorProps) {
  const [current, setCurrent] = useState<string | null>(value);
  const [draft, setDraft] = useState(value ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh data from the server wins over what was saved here last time.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setCurrent(value);
  }

  const startEditing = () => {
    setDraft(current ?? '');
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(current ?? '');
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    const next = draft.trim() || null;
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setCurrent(next);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <h2 className="flex-1 truncate text-2xl font-bold tracking-tight">
          {current || <span className="italic text-gray-500 dark:text-neutral-400">{emptyLabel}</span>}
        </h2>
        <button
          type="button"
          onClick={startEditing}
          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          title="Edit name"
          aria-label="Edit name"
        >
          <Edit2 className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 text-lg font-semibold"
          autoFocus
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save();
            if (e.key === 'Escape') cancel();
          }}
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          title="Save"
          aria-label="Save name"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
