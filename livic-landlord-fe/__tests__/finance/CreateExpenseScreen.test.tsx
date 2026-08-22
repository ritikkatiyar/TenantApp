import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateExpenseScreen from '../../src/features/finance/screens/CreateExpenseScreen';

const queryClient = new QueryClient();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    propertyId: 'prop-123',
    chargeId: undefined,
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

jest.mock('@/src/components/common/feedback/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('@/src/features/finance/hooks/useChargeConfig', () => ({
  useChargeConfig: () => ({
    chargeConfig: null,
    isLoading: false,
    refetch: jest.fn(),
    createConfig: jest.fn(),
    isCreating: false,
    updateConfig: jest.fn(),
    isUpdating: false,
  }),
}));

jest.setTimeout(30000);

describe('CreateExpenseScreen Component', () => {
  it('renders creation form fields correctly', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <CreateExpenseScreen token="token" />
      </QueryClientProvider>
    );

    expect(getByText('CHARGE NAME')).toBeTruthy();
  });
});
