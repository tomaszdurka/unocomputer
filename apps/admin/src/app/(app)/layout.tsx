import { Sidebar } from '@app/ui';
import { brand, navigation } from '#/config/navigation';
import NewRunButton from '#/components/runs/NewRunButton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar
        brandName={brand.name}
        brandInitial={brand.initial}
        items={navigation}
        action={<NewRunButton />}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
