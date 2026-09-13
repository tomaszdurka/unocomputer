'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// One listing for every app. The markup is a real <table>, so screen readers get
// row/column semantics and the header row is announced as such.
//
// Everything past `columns`/`rows`/`rowKey` is optional, because the apps using this
// genuinely differ:
//   - a paginated list passes `footer={<Pagination .../>}`; a list that shows
//     everything passes nothing
//   - a list with a caption strip passes `title` (and `headerActions`); a bare list
//     passes neither and the table starts at its header row
//   - a list whose rows are drill-downs passes `rowHref`; a list whose cells each link
//     somewhere different leaves it off and puts <Link> inside the cells

export type Column<Row> = {
  key: string;
  header: React.ReactNode;
  cell: (row: Row) => React.ReactNode;
  /** Column width, e.g. '190px' or '30%'. Rendered as a <col>. */
  width?: string;
  /** Extra classes on the <td>. */
  className?: string;
  /** Extra classes on the <th>. */
  headerClassName?: string;
};

export type DataTableProps<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /**
   * Makes the whole row navigate. The first column's content is wrapped in a real
   * <Link> so keyboard, middle-click and open-in-new-tab all work; the rest of the row
   * is a click target on top of that. Interactive elements in other cells must call
   * event.stopPropagation() so they win over the row.
   */
  rowHref?: (row: Row) => string;
  /** Caption strip above the table. Omit for a bare table. */
  title?: React.ReactNode;
  /** Right-aligned content in the caption strip. Requires `title`. */
  headerActions?: React.ReactNode;
  /** Shown in place of the body when there are no rows. */
  empty?: React.ReactNode;
  /** Below the table, inside the same bordered box - typically <Pagination />. */
  footer?: React.ReactNode;
};

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  rowHref,
  title,
  headerActions,
  empty = 'Nothing to show yet.',
  footer,
}: DataTableProps<Row>) {
  const router = useRouter();
  const hasWidths = columns.some((column) => column.width);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        {/* table-fixed once any width is declared: with auto layout a long cell in an
            unsized column outgrows its <col> hint and squeezes the rest off-screen,
            and `truncate` never kicks in because the cell has no width to truncate to. */}
        <table className={`w-full text-left text-sm ${hasWidths ? 'table-fixed' : ''}`}>
          {hasWidths ? (
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={column.width ? { width: column.width } : undefined} />
              ))}
            </colgroup>
          ) : null}

          <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-medium ${column.headerClassName ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-gray-500 dark:text-neutral-400"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={href ? () => router.push(href) : undefined}
                    className={
                      href
                        ? 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                        : undefined
                    }
                  >
                    {columns.map((column, index) => {
                      const content = column.cell(row);
                      return (
                        <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                          {href && index === 0 ? (
                            <Link href={href} className="hover:underline">
                              {content}
                            </Link>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer ? (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-800">{footer}</div>
      ) : null}
    </div>
  );
}
