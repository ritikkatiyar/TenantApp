import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyProperties } from '@/src/features/properties/api/propertyList.api';
import { deletePropertyApi, togglePropertyActiveApi } from '@/src/features/properties/api/property.api';
import type { PropertyResponse } from '@/src/types/property';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';

export function useProperties(search?: string) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading: isQueryLoading, error: queryError, refetch: refreshProperties } = useQuery<PropertyResponse[], Error>({
    queryKey: ['properties', user?.id, search],
    queryFn: () => getMyProperties(accessToken!, search),
    enabled: !!user?.id && !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (propertyId: string) => deletePropertyApi(propertyId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
    },
    onError: (err) => {
      logger.error('Error deleting property:', err);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ propertyId, active }: { propertyId: string; active: boolean }) =>
      togglePropertyActiveApi(propertyId, active, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
    },
    onError: (err) => {
      logger.error('Error toggling property active status:', err);
    }
  });

  const deleteProperty = async (propertyId: string) => {
    await deleteMutation.mutateAsync(propertyId);
  };

  const togglePropertyActive = async (propertyId: string, active: boolean) => {
    await toggleMutation.mutateAsync({ propertyId, active });
  };

  // Combine loading and error states for backward compatibility
  const isLoading = isQueryLoading || deleteMutation.isPending || toggleMutation.isPending;
  const error = queryError ? formatErrorMessage(queryError) : 
                (deleteMutation.error ? formatErrorMessage(deleteMutation.error) : 
                 (toggleMutation.error ? formatErrorMessage(toggleMutation.error) : null));

  return {
    properties,
    isLoading,
    error,
    refreshProperties,
    deleteProperty,
    togglePropertyActive
  };
}
