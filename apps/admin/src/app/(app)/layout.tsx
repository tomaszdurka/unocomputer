import { cookies } from 'next/headers';
import { SIDEBAR_MODE_COOKIE, Sidebar, sidebarModeFrom } from '@app/ui';
import { brand, navigation } from '#/config/navigation';
import NewRunButton from '#/components/runs/NewRunButton';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The sidebar's width comes from a cookie, so the server renders the width the
  // user chose instead of flashing the wide one and animating shut on every
  // navigation. Reading it makes this layout dynamic, which an admin UI is anyway.
  const store = await cookies();
  const initialMode = sidebarModeFrom(store.get(SIDEBAR_MODE_COOKIE)?.value);

  return (
    <div className="flex h-screen">
      <Sidebar
        brandName={brand.name}
        brandInitial={brand.initial}
        items={navigation}
        action={<NewRunButton />}
        initialMode={initialMode}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
