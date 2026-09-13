import { SettingsSidebar } from '@app/ui';
import { settingsNavigation } from '#/config/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SettingsSidebar items={settingsNavigation} backHref="/runs" backLabel="Back to app" />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
