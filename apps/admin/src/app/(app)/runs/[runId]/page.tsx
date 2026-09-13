import { getRun } from '#/lib/api';
import RunDetailView from '#/components/runs/RunDetailView';

// Live data over the backend socket; Next cannot infer that from a node:http
// call the way it could from fetch(), so opt out of prerendering explicitly.
export const dynamic = 'force-dynamic';

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  let run = null;
  let error = null;

  try {
    run = await getRun(runId);
  } catch (err: unknown) {
    error = (err instanceof Error ? err.message : String(err));
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {error ? (
        <div className="rounded-lg border bg-rose-50 dark:bg-rose-950/40 p-6">
          <div className="text-rose-900 dark:text-rose-300 font-semibold">Error loading run</div>
          <div className="text-sm text-rose-700 dark:text-rose-400 mt-2">{error}</div>
        </div>
      ) : run ? (
        <RunDetailView run={run} />
      ) : null}
    </div>
  );
}
