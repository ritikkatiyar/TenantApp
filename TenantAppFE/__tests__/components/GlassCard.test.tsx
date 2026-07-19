import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { GlassCard } from '../../src/components/common/display/GlassCard';

jest.mock('expo-blur', () => {
  const { View: MockView } = require('react-native');
  return {
    BlurView: MockView,
  };
});

describe('GlassCard Component', () => {
  it('renders children elements correctly', async () => {
    const { getByText } = await render(
      <GlassCard>
        <Text>Hello World</Text>
      </GlassCard>
    );
    expect(getByText('Hello World')).toBeTruthy();
  });
});
