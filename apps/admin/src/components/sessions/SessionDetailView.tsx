'use client';

import Link from 'next/link';
import type { Run, Session } from '#/lib/types';
import { useState } from 'react';
import { queueRun } from '#/lib/api';
import { Play } from 'lucide-react';
import RunPromptDialog from '#/components/runs/RunPromptDialog';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Separator } from '@app/ui';
import type { Column } from '@app/ui';

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function elapsedForRun(run: Run) {
  const started = Date.parse(run.startedAt ?? '');
  if (!started) return '-';
  const completed = run.completedAt ? Date.parse(run.completedAt) : null;
  const endTs = completed || Date.now();
  return formatElapsed(endTs - started);
}

function statusBadgeClass(status: string) {
  if (status === 'success') return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  if (status === 'running') return 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900';
  if (status === 'failure') return 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-900';
  if (status === 'stopped') return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
  return 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-800';
}

const runColumns: Column<Run>[] = [
  {
    key: 'prompt',
    header: 'Prompt',
    cell: (run) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{run.prompt || 'No prompt'}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-gray-500 dark:text-neutral-400">
          {run.runId}
        </p>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    width: '110px',
    cell: (run) => (
      <Badge variant="outline" className={statusBadgeClass(run.status)}>
        {run.status}
      </Badge>
    )
  },
  { key: 'elapsed', header: 'Elapsed', width: '110px', cell: (run) => elapsedForRun(run) },
  {
    key: 'started',
    header: 'Started',
    width: '220px',
    className: 'whitespace-nowrap text-gray-500 dark:text-neutral-400',
    cell: (run) => run.startedAt
  }
];

export default function SessionDetailView({ session }: { session: Session }) {
  const [showRunDialog, setShowRunDialog] = useState(false);
  const runs = session.runs ?? [];
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(a.startedAt ?? '') || 0) - (Date.parse(b.startedAt ?? '') || 0)
  );

  const handleRunSubmit = async ({ prompt, schema, model }: { prompt: string; schema?: unknown; model?: string }) => {
    return await queueRun({
      prompt,
      schema,
      sessionId: session.sessionId,
      model,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Session Info</CardTitle>
            <Button onClick={() => setShowRunDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Continue Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="grid-label">Session ID:</span>{' '}
            <span className="ml-2 font-mono">{session.sessionId}</span>
          </p>
          <p>
            <span className="grid-label">Workspace:</span>{' '}
            <span className="ml-2">
              {session.workspace ? (
                <Link href={`/workspaces/${session.workspace.workspaceId}`} className="text-mint hover:underline font-mono text-xs">
                  {session.workspace.name || session.workspace.workspaceId}
                </Link>
              ) : (
                '-'
              )}
            </span>
          </p>
          <p>
            <span className="grid-label">Created:</span>{' '}
            <span className="ml-2 text-gray-500 dark:text-neutral-400">{session.createdAt}</span>
          </p>
          <p>
            <span className="grid-label">Updated:</span>{' '}
            <span className="ml-2 text-gray-500 dark:text-neutral-400">{session.updatedAt}</span>
          </p>
          <p>
            <span className="grid-label">Runs:</span>{' '}
            <span className="ml-2">{runs.length}</span>
          </p>
        </CardContent>
      </Card>

      <RunPromptDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        onSubmit={handleRunSubmit}
        dialogTitle="Continue Session"
        runs={runs}
        submitButtonText="Run Prompt"
      />

      <DataTable
        title={`Runs (${sorted.length})`}
        columns={runColumns}
        rows={sorted}
        rowKey={(run) => run.runId}
        rowHref={(run) => `/runs/${run.runId}`}
        empty="No runs in this session yet."
      />
    </div>
  );
}
