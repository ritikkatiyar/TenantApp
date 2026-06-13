import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop };
}
