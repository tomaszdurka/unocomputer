import ProvidersSettings from '#/components/settings/ProvidersSettings';

export default function ProvidersSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Providers</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          The CLIs runs can be sent to, and the one they get by default.
        </p>
      </div>
      <ProvidersSettings />
    </div>
  );
}
