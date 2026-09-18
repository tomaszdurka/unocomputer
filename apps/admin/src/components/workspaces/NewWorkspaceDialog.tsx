'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter } from '@app/ui/dialog';
import { Button, Input, Label } from '@app/ui';
import { createWorkspace } from '#/lib/api';

type NewWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Bind a workspace to a folder, or get a managed one. The backend decides
 * whether the folder is acceptable; whatever it answers is shown as is.
 */
export default function NewWorkspaceDialog({ open, onOpenChange }: NewWorkspaceDialogProps) {
  const router = useRouter();
  const [directory, setDirectory] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDirectory('');
    setName('');
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const workspace = await createWorkspace({
        directory: directory.trim() || undefined,
        name: name.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      router.push(`/workspaces/${workspace.workspaceId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title="New workspace"
        description="Where an agent works. Bind it to a folder of yours, or leave the path empty for a managed one."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-workspace-directory">Folder</Label>
            <Input
              id="new-workspace-directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/Users/you/projects/app"
              className="font-mono text-sm"
              autoFocus
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Absolute path to an existing folder. One folder can have one workspace.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-workspace-name">Name</Label>
            <Input
              id="new-workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
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
