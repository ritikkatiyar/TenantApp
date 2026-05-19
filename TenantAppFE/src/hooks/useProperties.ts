import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getPropertiesByUser } from '../api/userPropertyRole.api';
import { deletePropertyApi } from '../api/property.api';
import type { PropertyResponse } from '../types/property';

export function useProperties() {
  const { user, accessToken } = useAuth();
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!user?.id || !accessToken) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getPropertiesByUser(user.id, accessToken);
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, accessToken]);

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
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(msg);
      throw err; // re-throw so the caller can show an alert
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    refreshProperties: fetchProperties,
    deleteProperty
  };
}
