import { apiRequest } from '@/src/api/client';

export interface ChargeConfigRequest {
    propertyId: string;
    chargeName: string;
    chargeCategory: string;
    billingFrequency: string;
    calculationStrategy: string;
    unitType?: string;
    baseRate?: number | null;
    applySalesTax: boolean;
    lateFeePercentage: number | null;
    autoCarryForward?: boolean;
}

export interface ChargeConfigResponse {
    id: string;
    propertyId: string;
    chargeName: string;
    chargeCategory: string;
    billingFrequency: string;
    calculationStrategy: string;
    unitType?: string;
    baseRate?: number | null;
    applySalesTax: boolean;
    lateFeePercentage: number | null;
    autoCarryForward?: boolean;
    isSystemRequired: boolean;
    isActive: boolean;
}

export const createChargeConfig = async (request: ChargeConfigRequest, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>('/api/v1/finance/charge-configs', {
        method: 'POST',
        token,
        body: JSON.stringify(request)
    });
};

export const getActiveChargesForProperty = async (propertyId: string, token: string): Promise<ChargeConfigResponse[]> => {
    if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
        return [];
    }
    return apiRequest<ChargeConfigResponse[]>(`/api/v1/finance/charge-configs/property/${propertyId}`, {
        method: 'GET',
        token
    });
};

export const getChargesForProperty = async (propertyId: string, includeInactive: boolean, token: string): Promise<ChargeConfigResponse[]> => {
    if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
        return [];
    }
    return apiRequest<ChargeConfigResponse[]>(`/api/v1/finance/charge-configs/property/${propertyId}?includeInactive=${includeInactive}`, {
        method: 'GET',
        token
    });
};

export const deactivateChargeConfig = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'DELETE',
        token
    });
};

export const reactivateChargeConfig = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}/reactivate`, {
        method: 'POST',
        token
    });
};

export const deleteChargeConfigPermanently = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}/permanent`, {
        method: 'DELETE',
        token
    });
};

export const updateChargeConfig = async (id: string, request: ChargeConfigRequest, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(request)
    });
};

export const getChargeConfigById = async (id: string, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'GET',
        token
    });
};
