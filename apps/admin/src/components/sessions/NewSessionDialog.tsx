'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter } from '@app/ui/dialog';
import { Button, Input, Label } from '@app/ui';
import { createSession } from '#/lib/api';

type NewSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
};

/**
 * A session ahead of its first run, so it can be named. The session page is
 * where the first prompt goes, same as every prompt after it.
 */
export default function NewSessionDialog({ open, onOpenChange, workspaceId }: NewSessionDialogProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('');
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await createSession({ workspaceId, name: name.trim() || undefined });
      setName('');
      onOpenChange(false);
      router.push(`/sessions/${session.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title="New session"
        description="A conversation in this workspace. Name it so you can tell it apart later."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-session-name">Name</Label>
            <Input
              id="new-session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              autoFocus
              disabled={submitting}
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
