'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@app/ui';

// libs/ui's Pagination is deliberately URL-agnostic - it takes an onPageChange callback
// so an app can drive it from wherever its page state lives. Here that state is the
// `?page=` query parameter, which keeps a page shareable and survives a refresh. This
// wrapper is the only place that mapping lives, rather than repeating it in each list.

export default function PagePagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    // Page 1 is the default, so it stays out of the URL and /runs?page=1 never
    // competes with /runs for the same view.
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={goTo}
    />
  );
}
