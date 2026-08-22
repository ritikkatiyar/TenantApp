import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getChargesForProperty, 
  deactivateChargeConfig, 
  reactivateChargeConfig, 
  deleteChargeConfigPermanently 
} from '@/src/features/finance/api/charge.api';

export function useExpenseConfiguration(propertyId: string | null, token: string | null) {
  const queryClient = useQueryClient();

  const { data: charges = [], isLoading, refetch } = useQuery({
    queryKey: ['propertyChargesAll', propertyId],
    queryFn: () => getChargesForProperty(propertyId!, true, token!),
    enabled: !!propertyId && !!token,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateChargeConfig(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyChargesAll'] });
      queryClient.invalidateQueries({ queryKey: ['propertyCharges'] });
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateChargeConfig(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyChargesAll'] });
      queryClient.invalidateQueries({ queryKey: ['propertyCharges'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChargeConfigPermanently(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyChargesAll'] });
      queryClient.invalidateQueries({ queryKey: ['propertyCharges'] });
    }
  });

  return {
    charges,
    isLoading,
    refetch,
    deactivateConfig: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
    reactivateConfig: reactivateMutation.mutateAsync,
    isReactivating: reactivateMutation.isPending,
    deleteConfig: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
