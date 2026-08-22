import React from 'react';
import { render } from '@testing-library/react-native';
import InventoryScreen from '../../src/features/inventory/screens/InventoryScreen';

jest.mock('../../src/features/inventory/hooks/useInventory', () => ({
  useInventory: () => ({
    activeTab: 'registry',
    setActiveTab: jest.fn(),
    query: '',
    setQuery: jest.fn(),
    serviceOnly: false,
    setServiceOnly: jest.fn(),
    filteredItems: [],
    rawItems: [],
    assignmentItems: [],
    verificationItems: [],
    stats: { total: 0, pending: 0, verified: 0 },
    totalDeductions: 0,
    securityDeposit: 10000,
    netRefund: 10000,
    leaseId: 'lease-123',
    propertyId: 'prop-123',
    properties: [],
    setSelectedPropertyId: jest.fn(),
    refresh: jest.fn(),
    isAddModalOpen: false,
    setIsAddModalOpen: jest.fn(),
    accessToken: 'token',
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('InventoryScreen Component', () => {
  it('renders correctly with tabs', async () => {
    const { getByText } = await render(<InventoryScreen />);
    expect(getByText('Registry')).toBeTruthy();
    expect(getByText('Move-In')).toBeTruthy();
    expect(getByText('Settlement')).toBeTruthy();
  });
});
