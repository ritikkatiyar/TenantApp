import React from 'react';
import { render } from '@testing-library/react-native';
import BillingWorksheetScreen from '../../src/features/finance/screens/BillingWorksheetScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    propertyId: 'prop-123',
  }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('@/src/hooks/useProperties', () => ({
  useProperties: () => ({
    properties: [{ id: 'prop-123', name: 'Greenwood Residency' }],
  }),
}));

jest.mock('@/src/features/finance/api/charge.api', () => ({
  getActiveChargesForProperty: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/src/features/finance/api/worksheet.api', () => ({
  getOrCreateWorksheet: jest.fn(() => Promise.resolve([])),
}));

describe('BillingWorksheetScreen Component', () => {
  it('renders correctly', async () => {
    const { getByText } = await render(<BillingWorksheetScreen token="token" />);
    expect(getByText('Worksheets')).toBeTruthy();
  }, 30000);
});
