import React from 'react';
import { Pressable as RNPressable, PressableProps, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';

interface CustomPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((state: { hovered: boolean; pressed: boolean; focused: boolean }) => StyleProp<ViewStyle>);
  children?: React.ReactNode | ((state: { hovered: boolean; pressed: boolean; focused: boolean }) => React.ReactNode);
}

export const Pressable = React.forwardRef<any, CustomPressableProps>(({ style, children, ...props }, ref) => {
  return (
    <RNPressable
      ref={ref}
      style={((state: any) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;
        return [
          styles.base,
          resolvedStyle,
          state.hovered && styles.hovered,
          state.pressed && styles.pressed,
          state.focused && styles.focused,
        ];
      }) as any}
      {...props}
    >
      {(state: any) => (typeof children === 'function' ? children(state) : children)}
    </RNPressable>
  );
});
Pressable.displayName = 'Pressable';

const styles = StyleSheet.create({
  base: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        outline: 'none',
      } as any,
      default: {},
    }),
  },
  hovered: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.7,
  },
  focused: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(0, 104, 117, 0.5)',
      } as any,
      default: {},
    }),
  },
});
