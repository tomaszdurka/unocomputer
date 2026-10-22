'use client';

import { useState } from 'react';
import { Button, useSidebarCollapsed } from '@app/ui';
import { Play } from 'lucide-react';
import RunPromptDialog from '#/components/runs/RunPromptDialog';
import { queueRun } from '#/lib/api';

// The primary action. It used to live in the top nav bar; with the sidebar shell it
// sits under the brand so it stays reachable from every page.
export default function NewRunButton() {
  const [open, setOpen] = useState(false);
  const collapsed = useSidebarCollapsed();

  const handleNewRun = async ({
    prompt,
    schema,
    model,
  }: {
    prompt: string;
    schema?: unknown;
    model?: string;
  }) => {
    // No workspaceId or sessionId - creates a new workspace and session.
    return await queueRun({ prompt, schema, model });
  };

  return (
    <>
      {/* The collapsed rail leaves 40px: the label goes, the icon and the
          tooltip stay, so a new run is startable at either width. */}
      <Button
        onClick={() => setOpen(true)}
        className={collapsed ? 'size-10 justify-center p-0' : 'w-full'}
        aria-label={collapsed ? 'New Run' : undefined}
        title={collapsed ? 'New Run' : undefined}
      >
        <Play className="h-4 w-4" />
        {collapsed ? null : 'New Run'}
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
