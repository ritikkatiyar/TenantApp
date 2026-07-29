import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusPill } from '../../src/components/common/display/StatusPill';

describe('StatusPill Component', () => {
  it('renders correctly with ACTIVE status', async () => {
    const { getByText } = await render(<StatusPill status="ACTIVE" />);
    expect(getByText('ACTIVE')).toBeTruthy();
  });

  it('renders correctly with PENDING status', async () => {
    const { getByText } = await render(<StatusPill status="PENDING" />);
    expect(getByText('PENDING')).toBeTruthy();
  });

  it('renders correctly with lowercase status', async () => {
    const { getByText } = await render(<StatusPill status="occupied" />);
    expect(getByText('OCCUPIED')).toBeTruthy();
  });
});
