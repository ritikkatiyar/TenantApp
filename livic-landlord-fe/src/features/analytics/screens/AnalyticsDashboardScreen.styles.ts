import { StyleSheet } from 'react-native';

export const createStyles = (theme: any, isDark: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      gap: 20,
    },
    scrollContentDesktop: {
      paddingTop: 24,
      paddingHorizontal: 32,
      paddingBottom: 40,
      width: '100%',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    mobileTitle: {
      fontSize: theme.Typography.titleLarge.fontSize,
      fontWeight: theme.Typography.titleLarge.fontWeight || '800',
      color: theme.Colors.onBackground,
    },
    demoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(91, 94, 207, 0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(91, 94, 207, 0.3)',
    },
    demoBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.Colors.secondary,
      letterSpacing: 0.5,
    },
    kpiGrid: {
      flexDirection: 'row',
      gap: isDesktop ? 16 : 8,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.Colors.glassFill,
      borderRadius: 16,
      padding: isDesktop ? 20 : 12,
      borderWidth: 1,
      borderColor: theme.Colors.glassStroke,
    },
    kpiLabel: {
      fontSize: isDesktop ? 10 : 9,
      fontWeight: '800',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    kpiValue: {
      fontSize: isDesktop ? theme.Typography.headlineSmall.fontSize : 16,
      fontWeight: '900',
      color: theme.Colors.onSurface,
      marginBottom: 2,
    },
    kpiSub: {
      fontSize: isDesktop ? theme.Typography.bodySmall.fontSize : 10,
      color: theme.Colors.onSurfaceVariant,
    },
    sectionRow: {
      flexDirection: 'column',
      gap: 20,
    },
    sectionRowDesktop: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    mainColumn: {
      flex: isDesktop ? 1.2 : undefined,
      gap: isDesktop ? 20 : 16,
    },
    sideColumn: {
      flex: isDesktop ? 1 : undefined,
      gap: isDesktop ? 20 : 16,
    },
    glassCard: {
      backgroundColor: theme.Colors.glassFill,
      borderRadius: isDesktop ? 24 : 16,
      padding: isDesktop ? 24 : 16,
      borderWidth: 1,
      borderColor: theme.Colors.glassStroke,
      overflow: 'hidden',
    },
    cardHeaderTitle: {
      fontSize: isDesktop ? theme.Typography.titleLarge.fontSize : 16,
      fontWeight: '800',
      color: theme.Colors.onBackground,
      marginBottom: isDesktop ? 20 : 12,
    },
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: isDesktop ? 200 : 130,
      borderBottomWidth: 1,
      borderBottomColor: theme.Colors.outlineVariant,
      paddingBottom: 8,
    },
    barColumn: {
      alignItems: 'center',
      width: 70,
    },
    barTrack: {
      height: isDesktop ? 130 : 80,
      width: 28,
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderRadius: 8,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: 8,
    },
    barValText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.Colors.primary,
      marginTop: 8,
    },
    barLabel: {
      fontSize: 11,
      color: theme.Colors.onSurfaceVariant,
      marginTop: 2,
    },
    expenseBreakdownList: {
      gap: 16,
    },
    expenseRow: {
      gap: 6,
    },
    expenseRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    expenseCategory: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    expenseValue: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '800',
      color: theme.Colors.error,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    occupancyList: {
      gap: 20,
    },
    occupancyItem: {
      gap: 8,
    },
    propHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    propertyName: {
      fontSize: theme.Typography.bodyLarge.fontSize,
      fontWeight: '800',
      color: theme.Colors.onSurface,
    },
    yieldPill: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.Colors.primary,
      backgroundColor: 'rgba(0, 104, 117, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    occupancyRateText: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
    defaultersList: {
      gap: 16,
    },
    defaulterItem: {
      backgroundColor: theme.Colors.glassFill,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.15)',
      gap: 4,
    },
    defHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    defName: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '700',
      color: theme.Colors.onSurface,
    },
    defAmount: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '800',
      color: theme.Colors.error,
    },
    defFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    defProperty: {
      fontSize: theme.Typography.bodySmall.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
    defDays: {
      fontSize: theme.Typography.bodySmall.fontSize,
      fontWeight: '700',
      color: theme.Colors.error,
    },
    allClearContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    allClearText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '700',
      color: theme.Colors.primary,
    },
    emptyText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      color: theme.Colors.onSurfaceVariant,
    },
  });
