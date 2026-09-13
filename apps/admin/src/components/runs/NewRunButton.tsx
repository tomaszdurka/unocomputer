'use client';

import { useState } from 'react';
import { Button } from '@app/ui';
import { Play } from 'lucide-react';
import RunPromptDialog from '#/components/runs/RunPromptDialog';
import { queueRun } from '#/lib/api';

// The primary action. It used to live in the top nav bar; with the sidebar shell it
// sits under the brand so it stays reachable from every page.
export default function NewRunButton() {
  const [open, setOpen] = useState(false);

  const handleNewRun = async ({ prompt, schema, model }: { prompt: string; schema?: unknown; model?: string }) => {
    // No workspaceId or sessionId - creates a new workspace and session.
    return await queueRun({ prompt, schema, model });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <Play className="h-4 w-4" />
        New Run
      </Button>

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
