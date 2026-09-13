'use client';

import Link from 'next/link';
import { DataTable } from '@app/ui';
import { Badge } from '#/components/ui/badge';

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

const columns = [
  {
    key: 'sessionId',
    header: 'Session ID',
    className: 'truncate',
    cell: (session) => (
      <span className="truncate font-mono font-medium">{session.sessionId}</span>
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

export default function SessionsListView({ sessions }) {
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
