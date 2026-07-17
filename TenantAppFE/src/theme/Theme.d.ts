import { TextStyle } from 'react-native';

export const Colors: {
  surfaceContainerLow: string;
  onPrimaryFixed: string;
  primaryContainer: string;
  surfaceTint: string;
  primaryFixed: string;
  onBackground: string;
  inverseOnSurface: string;
  outline: string;
  tertiaryContainer: string;
  onSecondaryFixedVariant: string;
  secondaryContainer: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  secondaryFixedDim: string;
  error: string;
  surfaceContainerLowest: string;
  surfaceContainerHighest: string;
  inversePrimary: string;
  tertiaryFixed: string;
  onSurfaceVariant: string;
  onSecondaryContainer: string;
  outlineVariant: string;
  secondaryFixed: string;
  onErrorContainer: string;
  surfaceDim: string;
  surfaceContainer: string;
  onTertiaryFixedVariant: string;
  surfaceBright: string;
  onTertiaryContainer: string;
  onPrimary: string;
  onSurface: string;
  onError: string;
  errorContainer: string;
  background: string;
  surfaceContainerHigh: string;
  onPrimaryFixedVariant: string;
  onSecondary: string;
  onPrimaryContainer: string;
  onSecondaryFixed: string;
  secondary: string;
  surfaceVariant: string;
  surface: string;
  primaryFixedDim: string;
  inverseSurface: string;
  tertiary: string;
  primary: string;
  onTertiary: string;
  glassFill: string;
  glassStroke: string;
  accentGradientStart: string;
  accentGradientEnd: string;
  backgroundGradient: string[];
};

export interface TypographyStyle extends Omit<TextStyle, 'fontWeight'> {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  lineHeight: number;
  letterSpacing?: number;
}

export const Typography: {
  displayMetrics: TypographyStyle;
  headlineXl: TypographyStyle;
  headlineLg: TypographyStyle;
  headlineMd: TypographyStyle;
  bodyLg: TypographyStyle;
  bodyMd: TypographyStyle;
  labelCaps: TypographyStyle;
  buttonText: TypographyStyle;
  labelMuted: TypographyStyle;
};

export const Spacing: {
  unit: number;
  containerPadding: number;
  gutter: number;
  stackSm: number;
  stackMd: number;
  stackLg: number;
};

export const Rounded: {
  sm: number;
  default: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export const Theme: {
  Colors: typeof Colors;
  Typography: typeof Typography;
  Spacing: typeof Spacing;
  Rounded: typeof Rounded;
};
