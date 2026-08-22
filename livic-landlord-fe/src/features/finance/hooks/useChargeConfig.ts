import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChargeConfigById, createChargeConfig, updateChargeConfig, ChargeConfigRequest } from '@/src/features/finance/api/charge.api';

export function useChargeConfig(chargeId: string | null | undefined, token: string | null) {
  const queryClient = useQueryClient();

  const { data: chargeConfig = null, isLoading, refetch } = useQuery({
    queryKey: ['chargeConfig', chargeId],
    queryFn: () => getChargeConfigById(chargeId!, token!),
    enabled: !!chargeId && !!token,
  });

  const createMutation = useMutation({
    mutationFn: (request: ChargeConfigRequest) => createChargeConfig(request, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyCharges'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (request: ChargeConfigRequest) => updateChargeConfig(chargeId!, request, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyCharges'] });
      queryClient.invalidateQueries({ queryKey: ['chargeConfig', chargeId] });
    }
  });

  return {
    chargeConfig,
    isLoading,
    refetch,
    createConfig: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
