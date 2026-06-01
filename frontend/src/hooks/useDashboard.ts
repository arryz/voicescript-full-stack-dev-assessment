import { useCallback } from 'react';
import { trpc } from '../lib/trpc';

export function useDashboard() {
  const { data: jobs = [], isLoading: loading, error } = trpc.jobs.list.useQuery();
  const utils = trpc.useUtils();

  const refresh = useCallback(() => {
    void utils.jobs.list.invalidate();
  }, [utils]);

  return {
    jobs,
    refresh,
    loading,
    error: error?.message ?? null,
  };
}
