'use client';

import { DataTable } from '@app/ui';
import { Badge } from '@app/ui';

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function elapsedForRun(run) {
  const started = Date.parse(run.startedAt ?? '');
  if (!started) return '-';
  if (!run.completedAt) return 'running...';
  const completed = Date.parse(run.completedAt);
  return formatElapsed(completed - started);
}

function statusBadgeClass(status) {
  if (status === 'success') return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
  if (status === 'running') return 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900';
  if (status === 'failure') return 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-900';
  if (status === 'stopped') return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900';
  return 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-800';
}

const columns = [
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
    key: 'model',
    header: 'Model',
    width: '120px',
    cell: (run) => (
      <Badge
        variant="outline"
        className="bg-gray-50 dark:bg-neutral-800/60 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-800"
      >
        {run.model || 'claude'}
      </Badge>
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

export default function RunsListView({ runs }) {
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0)
  );

  return (
    <DataTable
      title={`Recent Runs (${sorted.length})`}
      columns={columns}
      rows={sorted}
      rowKey={(run) => run.runId}
      rowHref={(run) => `/runs/${run.runId}`}
      empty='No runs yet. Click "New Run" to get started!'
    />
  );
}
