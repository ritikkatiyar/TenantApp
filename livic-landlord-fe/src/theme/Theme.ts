import { TextStyle } from 'react-native';

export const Colors = {
  surfaceContainerLow: "#edf5f7",
  onPrimaryFixed: "#001f24",
  primaryContainer: "#00e5ff",
  surfaceTint: "#006875",
  primaryFixed: "#9cf0ff",
  onBackground: "#151d1e",
  inverseOnSurface: "#eaf2f4",
  outline: "#6b7a7d",
  tertiaryContainer: "#fec931",
  onSecondaryFixedVariant: "#2f2ebe",
  secondaryContainer: "#6063ee",
  tertiaryFixedDim: "#f3bf26",
  onTertiaryFixed: "#251a00",
  secondaryFixedDim: "#c0c1ff",
  error: "#ba1a1a",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#dce4e5",
  inversePrimary: "#00daf3",
  tertiaryFixed: "#ffdf96",
  onSurfaceVariant: "#3b494c",
  onSecondaryContainer: "#fffbff",
  outlineVariant: "#bac9cc",
  secondaryFixed: "#e1e0ff",
  onErrorContainer: "#93000a",
  surfaceDim: "#d4dbdd",
  surfaceContainer: "#e8eff1",
  onTertiaryFixedVariant: "#594400",
  surfaceBright: "#f3fbfc",
  onTertiaryContainer: "#6f5500",
  onPrimary: "#ffffff",
  onSurface: "#151d1e",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  background: "#f3fbfc",
  surfaceContainerHigh: "#e2e9eb",
  onPrimaryFixedVariant: "#004f58",
  onSecondary: "#ffffff",
  onPrimaryContainer: "#00626e",
  onSecondaryFixed: "#07006c",
  secondary: "#4648d4",
  surfaceVariant: "#dce4e5",
  surface: "#f3fbfc",
  primaryFixedDim: "#00daf3",
  inverseSurface: "#2a3233",
  tertiary: "#765a00",
  primary: "#006875",
  onTertiary: "#ffffff",
  glassFill: 'rgba(255, 255, 255, 0.6)',
  glassStroke: 'rgba(255, 255, 255, 0.8)',
  accentGradientStart: "#00e0ff",
  accentGradientEnd: "#0070ea",
  backgroundGradient: ["#d4f5f9", "#e8f8fb", "#e2e0fb"] as string[],
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
} = {
  displayMetrics: {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  headlineXl: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  headlineLg: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
  },
  headlineMd: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  labelCaps: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  labelMuted: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  }
};

export const Spacing = {
  unit: 8,
  containerPadding: 20,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
};

export const Rounded = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Theme = {
  Colors,
  Typography,
  Spacing,
  Rounded,
};
