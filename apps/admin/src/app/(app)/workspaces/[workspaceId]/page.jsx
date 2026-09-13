import { getWorkspace } from '#/lib/api';
import WorkspaceDetailView from '#/components/workspaces/WorkspaceDetailView';

// Live data over the backend socket; Next cannot infer that from a node:http
// call the way it could from fetch(), so opt out of prerendering explicitly.
export const dynamic = 'force-dynamic';

export default async function WorkspaceDetailPage({ params }) {
  const { workspaceId } = await params;
  let workspace = null;
  let error = null;

  try {
    workspace = await getWorkspace(workspaceId);
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {error ? (
        <div className="rounded-lg border bg-rose-50 dark:bg-rose-950/40 p-6">
          <div className="text-rose-900 dark:text-rose-300 font-semibold">Error loading workspace</div>
          <div className="text-sm text-rose-700 dark:text-rose-400 mt-2">{error}</div>
        </div>
      ) : workspace ? (
        <WorkspaceDetailView workspace={workspace} />
      ) : null}
    </div>
  );
}
