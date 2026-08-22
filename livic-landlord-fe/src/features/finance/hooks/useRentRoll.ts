import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  listRentCycles, 
  batchGenerateRentCycle, 
  batchPublishRentCycle, 
  batchUnpublishRentCycle, 
  recordCashPayment, 
  publishRentCycle, 
  getPreFlightChecklist 
} from '@/src/features/finance/api/rentCycle.api';

export function useRentRoll(
  propertyId: string | null,
  billingMonth: string,
  debouncedSearchQuery: string,
  page: number,
  pageSize: number,
  token: string | null
) {
  const queryClient = useQueryClient();

  const queryKey = ['rentCycles', propertyId, billingMonth, debouncedSearchQuery, page, pageSize];

  const { data: rentCyclesData = null, isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey,
    queryFn: () => listRentCycles(
      billingMonth,
      token!,
      propertyId!,
      page,
      pageSize,
      undefined,
      debouncedSearchQuery
    ),
    enabled: !!propertyId && !!token,
  });

  const { data: checklistData = null, isLoading: isChecklistLoading } = useQuery({
    queryKey: ['preFlightChecklist', propertyId, billingMonth],
    queryFn: () => getPreFlightChecklist(propertyId!, billingMonth, token!),
    enabled: !!propertyId && !!token && !rentCyclesData?.content?.length,
  });

  const generateMutation = useMutation({
    mutationFn: (dueDate: string) => batchGenerateRentCycle(propertyId!, billingMonth, dueDate, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentCycles'] });
      queryClient.invalidateQueries({ queryKey: ['preFlightChecklist'] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: () => batchPublishRentCycle(propertyId!, billingMonth, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentCycles'] });
    }
  });

  const publishSingleMutation = useMutation({
    mutationFn: (id: string) => publishRentCycle(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentCycles'] });
    }
  });

  const unpublishMutation = useMutation({
    mutationFn: () => batchUnpublishRentCycle(propertyId!, billingMonth, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentCycles'] });
    }
  });

  const cashPaymentMutation = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      recordCashPayment(id, amount, note, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentCycles'] });
    }
  });

  const isLoading = isListLoading || isChecklistLoading;

  return {
    rentCyclesData,
    checklist: checklistData,
    isLoading,
    refetchList,
    generateRentCycle: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    publishRentCycles: publishMutation.mutateAsync,
    isPublishing: publishMutation.isPending,
    publishSingleInvoice: publishSingleMutation.mutateAsync,
    unpublishRentCycles: unpublishMutation.mutateAsync,
    isUnpublishing: unpublishMutation.isPending,
    recordCashPayment: cashPaymentMutation.mutateAsync,
    isRecordingCash: cashPaymentMutation.isPending,
  };
}
