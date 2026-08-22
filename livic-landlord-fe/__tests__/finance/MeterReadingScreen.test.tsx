import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeterReadingScreen from '../../src/features/finance/screens/MeterReadingScreen';

const queryClient = new QueryClient();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    propertyId: 'prop-123',
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('@/src/hooks/useProperties', () => ({
  useProperties: () => ({
    properties: [{ id: 'prop-123', name: 'Greenwood Residency' }],
  }),
}));

jest.mock('@/src/features/finance/hooks/useMeterReading', () => ({
  useMeterReading: () => ({
    isLoading: false,
    isSaving: false,
    configs: [
      {
        id: 'cfg-1',
        chargeName: 'Electricity',
        calculationStrategy: 'METERED',
      }
    ],
    selectedConfigId: 'cfg-1',
    setSelectedConfigId: jest.fn(),
    month: 10,
    year: 2023,
    worksheet: [
      {
        id: 'w-1',
        unitId: 'unit-1',
        unitName: 'Unit 101',
        floor: 1,
        tenantName: 'John Doe',
        previousReading: 1200,
        currentReading: 1250,
      }
    ],
    inputs: {},
    setInputs: jest.fn(),
    prevInputs: {},
    setPrevInputs: jest.fn(),
    inputRefs: { current: {} },
    expandedFloors: { 1: true },
    setExpandedFloors: jest.fn(),
    floorPages: {},
    setFloorPages: jest.fn(),
    floorPage: 1,
    setFloorPage: jest.fn(),
    toggleFloor: jest.fn(),
    handleSave: jest.fn(),
    changeMonth: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('MeterReadingScreen Component', () => {
  it('renders utility configurations and unit rows correctly', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <MeterReadingScreen token="token" />
      </QueryClientProvider>
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Unit 101')).toBeTruthy();
  });
});
