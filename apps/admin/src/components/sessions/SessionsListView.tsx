'use client';

import Link from 'next/link';
import type { Session } from '#/lib/types';
import { DataTable } from '@app/ui';
import type { Column } from '@app/ui';
import { Badge } from '@app/ui';

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

const columns: Column<Session>[] = [
  {
    key: 'session',
    header: 'Session',
    cell: (session) => (
      <div className="min-w-0">
        <p className="truncate font-medium">
          {session.name || <span className="italic font-normal text-gray-500 dark:text-neutral-400">Unnamed</span>}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-gray-500 dark:text-neutral-400">
          {session.sessionId}
        </p>
      </div>
    )
  },
  {
    key: 'workspace',
    header: 'Workspace',
    className: 'truncate',
    cell: (session) =>
      session.workspace ? (
        // Nested link inside a navigating row: stopPropagation so this wins over the
        // row's own click handler.
        <Link
          href={`/workspaces/${session.workspace.workspaceId}`}
          className="font-mono text-xs text-mint hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {session.workspace.name || session.workspace.workspaceId}
        </Link>
      ) : (
        '-'
      )
  },
  {
    key: 'runs',
    header: 'Runs',
    width: '110px',
    cell: (session) => (
      <Badge
        variant="outline"
        className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900"
      >
        {session.runs?.length || 0} run{session.runs?.length !== 1 ? 's' : ''}
      </Badge>
    )
  },
  {
    key: 'created',
    header: 'Created',
    width: '200px',
    className: 'whitespace-nowrap text-gray-500 dark:text-neutral-400',
    cell: (session) => formatDate(session.createdAt)
  }
];

export default function SessionsListView({ sessions }: { sessions: Session[] }) {
  const sorted = [...sessions].sort(
    (a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
  );

  return (
    <DataTable
      title={`All Sessions (${sorted.length})`}
      columns={columns}
      rows={sorted}
      rowKey={(session) => session.sessionId}
      rowHref={(session) => `/sessions/${session.sessionId}`}
      empty="No sessions found."
    />
  );
}
