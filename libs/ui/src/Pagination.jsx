'use client';

// Pairs with DataTable's `footer` slot, but stands alone fine. Page numbers are
// 1-based to match the paginated DTOs the backend emits.


export function Pagination({ page, pageSize, total, onPageChange }) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const buttonClasses =
    'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 ' +
    'hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent ' +
    'dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800';

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 dark:text-neutral-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={buttonClasses}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          className={buttonClasses}
        >
          Next
        </button>
      </div>
    </div>
  );
}
