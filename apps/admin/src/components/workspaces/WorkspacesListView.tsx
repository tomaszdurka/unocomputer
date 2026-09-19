'use client';

import { DataTable } from '@app/ui';
import PagePagination from '#/components/PagePagination';
import type { Column } from '@app/ui';
import type { Workspace, Paginated } from '#/lib/types';

const muted = 'text-gray-500 dark:text-neutral-400';

const columns: Column<Workspace>[] = [
  {
    key: 'name',
    header: 'Name',
    className: 'truncate',
    cell: (workspace) =>
      workspace.name || <span className={`italic font-normal ${muted}`}>Unnamed</span>
  },
  {
    key: 'workspaceId',
    header: 'Workspace ID',
    className: `truncate font-mono text-xs ${muted}`,
    cell: (workspace) => workspace.workspaceId
  },
  {
    key: 'workingDir',
    header: 'Working Dir',
    className: `truncate text-xs ${muted}`,
    cell: (workspace) => workspace.workingDir || '-'
  },
  {
    key: 'runs',
    header: 'Runs',
    width: '80px',
    className: 'text-xs',
    cell: (workspace) => workspace.runs?.length ?? 0
  },
  {
    key: 'created',
    header: 'Created',
    width: '200px',
    className: `whitespace-nowrap text-xs ${muted}`,
    cell: (workspace) => workspace.createdAt
  },
  {
    key: 'updated',
    header: 'Updated',
    width: '200px',
    className: `whitespace-nowrap text-xs ${muted}`,
    cell: (workspace) => workspace.updatedAt
  }
];

// No caption strip here - the page already has a "Workspaces" heading above it, so a
// second title inside the box would just repeat it.
export default function WorkspacesListView({ workspaces }: { workspaces: Paginated<Workspace> }) {
  return (
    <DataTable
      columns={columns}
      rows={workspaces.items}
      rowKey={(workspace) => workspace.workspaceId}
      rowHref={(workspace) => `/workspaces/${workspace.workspaceId}`}
      footer={
        workspaces.total > workspaces.pageSize ? (
          <PagePagination page={workspaces.page} pageSize={workspaces.pageSize} total={workspaces.total} />
        ) : null
      }
      empty="No workspaces found."
    />
  );
}
