import { StyleSheet } from 'react-native';

export const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(11, 28, 48, 0.35)',
      zIndex: 99998,
    },
    container: {
      position: 'absolute',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.85)',
      backgroundColor: isDark ? 'rgba(19, 28, 38, 0.85)' : 'rgba(255, 255, 255, 0.88)',
      overflow: 'hidden',
      shadowColor: theme.Colors.shadowColor || '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 99999,
    },
    bubbleTrigger: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleGradient: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatContent: {
      flex: 1,
    },
    header: {
      paddingTop: theme.Spacing.sm,
      paddingHorizontal: theme.Spacing.md,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    dragBarWrapper: {
      alignSelf: 'center',
      width: 60,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dragBar: {
      width: 38,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: 'rgba(0, 104, 117, 0.25)',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.Spacing.xs,
    },
    headerIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(0, 104, 117, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: theme.Typography.titleSmall.fontSize,
      fontWeight: '800',
      color: theme.Colors.onSurface,
    },
    closeBtn: {
      padding: 6,
    },
    messagesList: {
      flex: 1,
    },
    messagesContainer: {
      padding: theme.Spacing.md,
      gap: 12,
    },
    examplesWrapper: {
      gap: theme.Spacing.sm,
      marginBottom: theme.Spacing.sm,
    },
    examplesHeader: {
      fontSize: theme.Typography.labelSmall.fontSize,
      fontWeight: '700',
      color: theme.Colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    examplePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.75)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 14,
      paddingVertical: theme.Spacing.sm,
      paddingHorizontal: 12,
      gap: 6,
    },
    exampleText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.primary,
      fontWeight: '600',
      flex: 1,
    },
    msgWrapper: {
      flexDirection: 'row',
      width: '100%',
    },
    msgUser: {
      justifyContent: 'flex-end',
    },
    msgAssistant: {
      justifyContent: 'flex-start',
    },
    msgBubble: {
      maxWidth: '85%',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
    },
    bubbleUser: {
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      borderBottomLeftRadius: 4,
    },
    msgText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      lineHeight: 19,
    },
    textUser: {
      fontWeight: '600',
    },
    textAssistant: {
      fontWeight: '500',
    },
    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.Spacing.sm,
    },
    loadingText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '600',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      gap: 10,
      backgroundColor: isDark ? 'rgba(19, 28, 38, 0.9)' : 'rgba(255, 255, 255, 0.75)',
    },
    input: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: theme.Spacing.sm,
      fontSize: theme.Typography.bodyMedium.fontSize,
      maxHeight: 80,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
    },
    sendGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
