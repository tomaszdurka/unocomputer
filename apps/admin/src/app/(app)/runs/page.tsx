import { listRuns } from '#/lib/api';
import { pageFromSearchParams } from '#/lib/pagination';
import RunsListView from '#/components/runs/RunsListView';

export const dynamic = 'force-dynamic';

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const runs = await listRuns(pageFromSearchParams(page));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">All Runs</h1>
      <RunsListView runs={runs} />
    </div>
  );
}
