import { useCallback, useEffect, useState } from 'react';
import { JobListItem } from '../types/api';
import * as api from '../services/api';

export function useDashboard() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    api
      .fetchJobs()
      .then((data) => {
        setJobs(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { jobs, refresh, loading, error };
}
