export const dynamic = 'force-dynamic';

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          Basic information about this app.
        </p>
      </div>

      <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-neutral-400">Name</dt>
          <dd className="text-sm font-medium">UnoComputer</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-neutral-400">API</dt>
          <dd className="text-sm font-medium">/api (proxied to unix socket)</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-neutral-400">Workspaces</dt>
          <dd className="text-sm font-medium">
            {process.env.WORKSPACES_DIR ?? './workspaces'}
          </dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-neutral-400">Environment</dt>
          <dd className="text-sm font-medium">{process.env.NODE_ENV}</dd>
        </div>
      </dl>
    </div>
  );
}
