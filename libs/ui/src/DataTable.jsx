'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export function DataTable({ columns, rows, rowKey, rowHref, title, headerActions, empty = 'Nothing to show yet.', footer, }) {
    const router = useRouter();
    const hasWidths = columns.some((column) => column.width);
    return (<div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {title ? (<div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </div>) : null}

      <div className="overflow-x-auto">
        {/* table-fixed once any width is declared: with auto layout a long cell in an
            unsized column outgrows its <col> hint and squeezes the rest off-screen,
            and `truncate` never kicks in because the cell has no width to truncate to. */}
        <table className={`w-full text-left text-sm ${hasWidths ? 'table-fixed' : ''}`}>
          {hasWidths ? (<colgroup>
              {columns.map((column) => (<col key={column.key} style={column.width ? { width: column.width } : undefined}/>))}
            </colgroup>) : null}

          <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-neutral-400">
            <tr>
              {columns.map((column) => (<th key={column.key} scope="col" className={`px-4 py-3 font-medium ${column.headerClassName ?? ''}`}>
                  {column.header}
                </th>))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {rows.length === 0 ? (<tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
                  {empty}
                </td>
              </tr>) : (rows.map((row) => {
            const href = rowHref?.(row);
            return (<tr key={rowKey(row)} onClick={href ? () => router.push(href) : undefined} className={href
                    ? 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                    : undefined}>
                    {columns.map((column, index) => {
                    const content = column.cell(row);
                    return (<td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                          {href && index === 0 ? (<Link href={href} className="hover:underline">
                              {content}
                            </Link>) : (content)}
                        </td>);
                })}
                  </tr>);
        }))}
          </tbody>
        </table>
      </div>

      {footer ? (<div className="border-t border-gray-200 px-4 py-3 dark:border-neutral-800">{footer}</div>) : null}
    </div>);
}
