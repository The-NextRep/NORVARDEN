/**
 * /admin/activity — admin activity log, newest first.
 */
import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import AdminLayout from '@/components/admin/AdminLayout';
import ActivityList, { type ActivityEntry } from '@/components/admin/ActivityList';
import {
  EmptyState,
  ErrorNote,
  Pager,
  Panel,
  Spinner,
} from '@/components/admin/AdminUi';
import { adminFetch } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';

interface ListResponse { entries: ActivityEntry[]; total: number; page: number; pageSize: number }

function ActivityInner() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<ListResponse>(`/api/admin/activity?page=${page}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout
      title="Activity"
      subtitle="Every approval, rejection, suspension and access change made by an admin."
      metaDescription="Admin activity log for REP | IV."
    >
      <ErrorNote message={error} />
      {loading && !data ? <Spinner /> : !data || data.entries.length === 0 ? (
        <EmptyState icon={<History size={32} style={{ color: t.lineStrong }} />} title="No activity yet." />
      ) : (
        <Panel className="px-5" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          <ActivityList entries={data.entries} />
        </Panel>
      )}
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
    </AdminLayout>
  );
}

export default function AdminActivityPage() {
  return (
    <AdminGuard>
      <ActivityInner />
    </AdminGuard>
  );
}
