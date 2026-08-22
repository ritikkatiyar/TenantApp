import { useQuery } from '@tanstack/react-query';
import { getLedgerForProperty } from '../api/ledger.api';

export function useLedger(
  propertyId: string | null,
  page: number,
  fromDate: string,
  toDate: string,
  debouncedSearchQuery: string,
  token: string | null
) {
  const queryKey = ['ledger', propertyId, page, fromDate, toDate, debouncedSearchQuery];

  const { data = null, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      let validatedFrom: string | undefined = undefined;
      if (fromDate.trim()) {
        const d = new Date(fromDate.trim());
        if (!isNaN(d.getTime())) {
          validatedFrom = d.toISOString();
        }
      }

      let validatedTo: string | undefined = undefined;
      if (toDate.trim()) {
        const d = new Date(toDate.trim());
        if (!isNaN(d.getTime())) {
          validatedTo = d.toISOString();
        }
      }

      return getLedgerForProperty(
        propertyId!,
        token!,
        page,
        20,
        validatedFrom,
        validatedTo,
        debouncedSearchQuery
      );
    },
    enabled: !!propertyId && !!token,
  });

  return {
    ledger: data?.content || [],
    totalPages: data?.totalPages || 0,
    isLoading,
    refetch,
  };
}
