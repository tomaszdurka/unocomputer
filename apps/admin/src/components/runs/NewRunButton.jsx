'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import RunPromptDialog from '#/components/runs/RunPromptDialog';
import { queueRun } from '#/lib/api';

// The primary action. It used to live in the top nav bar; with the sidebar shell it
// sits under the brand so it stays reachable from every page.
export default function NewRunButton() {
  const [open, setOpen] = useState(false);

  const handleNewRun = async ({ prompt, schema, model }) => {
    // No workspaceId or sessionId - creates a new workspace and session.
    return await queueRun({ prompt, schema, model });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-mint/90"
      >
        <Play className="h-4 w-4" />
        New Run
      </button>

      <RunPromptDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleNewRun}
        dialogTitle="New Run (Creates New Workspace)"
        runs={[]}
        submitButtonText="Start Run"
      />
    </>
  );
}
