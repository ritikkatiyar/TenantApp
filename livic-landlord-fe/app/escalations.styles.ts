import { StyleSheet } from 'react-native';
import { Theme } from '@/src/theme/Theme';

export const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden'
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center'
  },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    letterSpacing: 1
  },
  mobileScroll: {
    paddingHorizontal: 24,
    paddingTop: 76,
    paddingBottom: 60
  },
  desktopScroll: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    alignItems: 'center'
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080
  },
  titleContainer: {
    marginTop: 16,
    marginBottom: 24
  },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    lineHeight: 38,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  metricLabel: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 4
  },
  metricValue: {
    fontSize: theme.Typography.HeadlineSmall.fontSize,
    fontWeight: '800'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyMedium.fontSize,
    outlineWidth: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  filterLabelText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
    width: 60
  },
  filterScroll: {
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  filterPillActive: {
    backgroundColor: theme.Colors.primary
  },
  filterText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: '#2e3a3c',
    fontWeight: '600'
  },
  filterTextActive: {
    color: theme.Colors.surfaceContainerLowest
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.error,
    textAlign: 'center',
    marginBottom: 16
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginTop: 20
  },
  emptyTitle: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    marginTop: 12,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320
  },
  listContainer: {
    gap: 16
  },
  mobileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardUnitText: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface
  },
  cardTitleText: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    marginBottom: 6
  },
  cardDescText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 10
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  cardDateText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  pillText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800'
  },
  filterButton: {
    backgroundColor: theme.Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 20
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)'
  },
  pageText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface
  }
});
