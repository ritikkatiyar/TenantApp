import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { assignmentItems } from '@/src/features/inventory/mockInventoryData';
import { AssignmentCard, SummaryLine } from './InventoryCardComponents';

interface InventoryMoveInViewProps {
  isDesktop: boolean;
}

export function InventoryMoveInView({ isDesktop }: InventoryMoveInViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const selectedCount = assignmentItems.filter(i => i.assignmentStatus !== 'Unselected').length;
  const photoCount    = assignmentItems.reduce((s, i) => s + i.photoCount, 0);
  const progress      = selectedCount / assignmentItems.length;

  return (
    <View style={styles.sectionStack}>
      <BlurView intensity={35} tint="light" style={styles.moveBanner}>
        <LinearGradient
          colors={['rgba(0,104,117,0.85)', 'rgba(79,70,229,0.85)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>NEW MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.moveBannerTitle}>Jordan Mitchell</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-8824 · Unit 402-B · Move-in Jul 20, 2026</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressFraction}>{selectedCount}/{assignmentItems.length}</Text>
          <Text style={styles.progressSublabel}>items done</Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#a5f3fc', '#fff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
            />
          </View>
        </View>
      </BlurView>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          <View style={styles.workflowHeader}>
            <Text style={styles.panelTitle}>Inventory Checklist</Text>
            <View style={styles.panelActions}>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Select All</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Filter</Text></TouchableOpacity>
            </View>
          </View>
          {assignmentItems.map(item => <AssignmentCard key={item.id} item={item} />)}
        </View>

        <BlurView intensity={65} tint="light" style={styles.rail}>
          <View style={styles.railHeader}>
            <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.railIconCircle}>
              <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
            </LinearGradient>
            <Text style={styles.panelTitle}>Summary</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Selected Items"  value={`${selectedCount} items`} />
            <SummaryLine label="Photos Attached" value={`${photoCount} photos`} />
            <SummaryLine label="Needs Attention" value="1 item" danger />
            <View style={styles.railDivider} />
            <SummaryLine label="Kitchen Appliances" value="98/100" />
            <SummaryLine label="Living Fixtures"    value="Draft" />
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <LinearGradient
              colors={[theme.Colors.primary, '#0072ff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryWideBtnInner}
            >
              <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.primaryWideBtnText}>Confirm Assignment</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostWideBtn}>
            <Text style={styles.ghostWideBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: 16 },
  moveBanner: { borderRadius: 22, overflow: 'hidden', minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: 16 },
  moveBannerContent: { flex: 1 },
  moveBannerKicker: { fontSize: theme.Typography.LabelSmall.fontSize, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontFamily: 'Inter' },
  moveBannerTitle: { fontSize: theme.Typography.TitleLarge.fontSize, fontWeight: '900', color: theme.Colors.surfaceContainerLowest, marginTop: 4, fontFamily: 'Inter' },
  moveBannerMeta: { fontSize: theme.Typography.BodySmall.fontSize, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily: 'Inter' },
  progressBox: { alignItems: 'flex-end', gap: 4, minWidth: 100 },
  progressFraction: { fontSize: theme.Typography.HeadlineSmall.fontSize, fontWeight: '900', color: theme.Colors.surfaceContainerLowest, fontFamily: 'Inter' },
  progressSublabel: { fontSize: theme.Typography.LabelSmall.fontSize, color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: 'Inter' },
  progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  workflowGrid: { gap: 14 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ghostBtn: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  ghostBtnText: { fontSize: theme.Typography.BodySmall.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant, fontFamily: 'Inter' },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  panelActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rail: { flex: 1, minWidth: 260, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', padding: 16, gap: 14, overflow: 'hidden' },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 2 },
  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  primaryWideBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '800', fontFamily: 'Inter' },
  ghostWideBtn: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', paddingVertical: 13, alignItems: 'center' },
  ghostWideBtnText: { fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant, fontFamily: 'Inter' },
});
