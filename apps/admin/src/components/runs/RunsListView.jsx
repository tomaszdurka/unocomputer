'use client';

import Link from 'next/link';
import { Badge } from '#/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';

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

export default function RunsListView({ runs }) {
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Runs ({sorted.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,3fr)_120px_110px_110px_190px]">
          <span>Prompt</span>
          <span>Model</span>
          <span>Status</span>
          <span>Elapsed</span>
          <span>Started</span>
        </div>
        <ul className="divide-y">
          {sorted.map((run) => (
            <li key={run.runId}>
              <Link href={`/runs/${run.runId}`} className="block px-4 py-4 transition hover:bg-muted/40">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_120px_110px_110px_190px]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{run.prompt || 'No prompt'}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{run.runId}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="bg-gray-50 dark:bg-neutral-800/60 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-800">
                      {run.model || 'claude'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className={statusBadgeClass(run.status)}>
                      {run.status}
                    </Badge>
                  </div>
                  <div className="text-xs">{elapsedForRun(run)}</div>
                  <div className="text-xs text-muted-foreground">{run.startedAt}</div>
                </div>
              </Link>
            </li>
          ))}
          {sorted.length === 0 ? (
            <li className="p-10 text-center text-sm text-muted-foreground">
              No runs yet. Click "New Run" to get started!
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
