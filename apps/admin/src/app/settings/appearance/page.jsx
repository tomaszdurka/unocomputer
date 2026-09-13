import { AppearanceSettings } from '@app/ui';

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
          How the app looks on this device.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Theme</h2>
        <AppearanceSettings />
      </section>
    </div>
  );
}
