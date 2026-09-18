'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@app/ui';
import NewWorkspaceDialog from './NewWorkspaceDialog';

export default function NewWorkspaceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New workspace
      </Button>
      <NewWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
