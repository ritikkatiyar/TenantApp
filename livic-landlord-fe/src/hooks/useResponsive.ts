import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '@/src/theme/Theme';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isMobile = width < Breakpoints.tablet;
  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.desktop;
  const isDesktop = width >= Breakpoints.desktop;
  return { isMobile, isTablet, isDesktop, width };
}
