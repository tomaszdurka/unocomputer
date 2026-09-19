import { listSessions } from '#/lib/api';
import { pageFromSearchParams } from '#/lib/pagination';
import SessionsListView from '#/components/sessions/SessionsListView';

export const dynamic = 'force-dynamic';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const sessions = await listSessions(pageFromSearchParams(page));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sessions</h1>
      <SessionsListView sessions={sessions} />
    </div>
  );
}
