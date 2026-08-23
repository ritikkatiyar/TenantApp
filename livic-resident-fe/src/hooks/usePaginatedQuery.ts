import { useState, useEffect, useCallback } from 'react';

export function usePaginatedQuery<T>(
  fetchFn: (page: number, size: number) => Promise<{ content: T[]; totalPages: number }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchFn(page, 20);
      setData(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch paginated data');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps]);

  useEffect(() => {
    executeFetch();
  }, [executeFetch]);

  return {
    data,
    page,
    setPage,
    totalPages,
    isLoading,
    error,
    refresh: executeFetch,
  };
}
