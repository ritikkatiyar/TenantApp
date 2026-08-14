import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyProperties } from '@/src/features/properties/api/propertyList.api';
import { deletePropertyApi, togglePropertyActiveApi } from '@/src/features/properties/api/property.api';
import type { PropertyResponse } from '@/src/types/property';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';

export function useProperties(search?: string) {
  const { user, accessToken } = useAuth();
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!user?.id || !accessToken) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyProperties(accessToken, search);
      setProperties(data);
    } catch (err) {
      setError(formatErrorMessage(err));
      logger.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, accessToken, search]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      await deletePropertyApi(propertyId, accessToken);
      await fetchProperties(); // refresh after deletion
    } catch (err) {
      const msg = formatErrorMessage(err);
      setError(msg);
      throw err; // re-throw so the caller can show an alert
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchProperties]);

  const togglePropertyActive = useCallback(async (propertyId: string, active: boolean) => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      await togglePropertyActiveApi(propertyId, active, accessToken);
      await fetchProperties(); // refresh after update
    } catch (err) {
      const msg = formatErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    refreshProperties: fetchProperties,
    deleteProperty,
    togglePropertyActive
  };
}
