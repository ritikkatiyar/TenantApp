import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useExpenseConfiguration } from '@/src/features/finance/hooks/useExpenseConfiguration';

// Sub-components
import { ExpenseConfigCard } from '../components/billing/ExpenseConfigCard';
import { ConfirmModal } from '../components/billing/ConfirmModal';

export default function ExpenseConfigurationScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { showToast } = useToast();

  const {
    charges,
    isLoading,
    deactivateConfig,
    reactivateConfig,
    deleteConfig,
  } = useExpenseConfiguration(propertyId, token);

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        onConfirm();
      }
    });
  };

  const handleDeactivate = (id: string) => {
    requestConfirmation(
      "Deactivate Charge?",
      "Deactivating this configuration will prevent compiling future invoices. Active worksheets will not be affected.",
      async () => {
        try {
          await deactivateConfig(id);
          showToast("Charge configuration deactivated", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to deactivate charge.", "error");
        }
      }
    );
  };

  const handleReactivate = (id: string) => {
    requestConfirmation(
      "Reactivate Charge?",
      "This will resume invoice generation triggers and ledger mappings for this category.",
      async () => {
        try {
          await reactivateConfig(id);
          showToast("Charge configuration reactivated!", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to reactivate charge.", "error");
        }
      }
    );
  };

  const handleDeletePermanently = (id: string) => {
    requestConfirmation(
      "Delete Permanently?",
      "This action cannot be undone. All active worksheets, meter records & drafts using this charge configuration will be permanently deleted.",
      async () => {
        try {
          await deleteConfig(id);
          showToast("Charge configuration permanently deleted.", "success");
        } catch (e: any) {
          showToast(e.message || "Failed to delete configuration.", "error");
        }
      }
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="business" size={36} color={theme.Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Property Created Yet</Text>
          <Text style={styles.emptySubtitle}>
            Setup your property profile and floor layout to activate expense configuration panels.
          </Text>
          <TouchableOpacity 
            style={styles.createPropertyButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/properties/create')}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPropertyGradient}
            >
              <MaterialIcons name="add" size={24} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.createPropertyText}>CREATE FIRST PROPERTY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      );
    }

    if (isLoading && charges.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      );
    }

    if (charges.length === 0) {
      return (
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="receipt-long" size={36} color={theme.Colors.onSurfaceVariant} />
          </View>
          <Text style={styles.emptyTitle}>No charges found.</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your overheads by adding your first charge category.
          </Text>
          
          <TouchableOpacity 
            style={styles.createPropertyButton} 
            activeOpacity={0.8}
            onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createPropertyGradient}
            >
              <MaterialIcons name="add" size={24} color={theme.Colors.surfaceContainerLowest} />
              <Text style={styles.createPropertyText}>CREATE CHARGE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      );
    }

    return (
      <View style={isDesktop ? styles.gridContainer : styles.listContainer}>
        {charges.map(charge => (
          <ExpenseConfigCard
            key={charge.id}
            charge={charge}
            propertyId={propertyId}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDeletePermanently}
            isDesktop={isDesktop}
            isDark={isDark}
          />
        ))}
      </View>
    );
  };

  const renderDesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.desktopShell}
    >
      <View style={styles.desktopMain}>
        <DesktopNavBar 
          onBack={() => router.push('/expenses')} 
          backText="Back to Finance & Billing" 
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace({ pathname: '/expenses/configuration', params: { propertyId: id } } as any)}
        />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainer}>
                <Text style={styles.titleLineDesktop}>Billing Configurations</Text>
                <Text style={styles.subtitleDesktop}>Manage ledger entries, metered utilities, penalty strategies & tax groups</Text>
              </View>

              <TouchableOpacity 
                style={styles.desktopCreateButtonWrapper} 
                onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.desktopCreateButton}
                >
                  <Text style={styles.desktopCreateButtonText}>CONFIGURE EXPENSE</Text>
                  <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {renderContent()}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );

  const renderMobileShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, paddingTop: insets.top, height: 56 + insets.top }]}>
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>Configurations</Text>
            </View>
            <TouchableOpacity 
              style={styles.headerCreateTouch}
              onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerCreateInner}
              >
                <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                <Text style={styles.headerCreateText}>ADD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 68 + insets.top }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
              <Text style={styles.screenTitle}>Billing Elements</Text>
              <Text style={styles.screenSubtitle}>Configure ledger charge codes, utility scales and automation thresholds</Text>
            </Animated.View>

            {renderContent()}

            {!isDesktop && charges.length > 0 && !isLoading && (
              <TouchableOpacity 
                style={styles.dashedButton} 
                activeOpacity={0.7}
                onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
              >
                <View style={styles.dashedIconCircle}>
                   <MaterialIcons name="add" size={24} color="#00bcd4" />
                </View>
                <Text style={styles.dashedButtonText}>Create New Expense</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1 }}>
      {isDesktop ? renderDesktopShell() : renderMobileShell()}

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 998,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: { flex: 1, alignItems: 'center' },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontFamily: 'Inter',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerCreateTouch: { borderRadius: 12, overflow: 'hidden' },
  headerCreateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  headerCreateText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inner: { width: '100%' },
  titleContainer: {
    marginTop: 10,
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontFamily: 'Outfit',
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  screenSubtitle: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createPropertyButton: { borderRadius: 100, overflow: 'hidden' },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createPropertyText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  listContainer: {
    width: '100%',
  },
  dashedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 188, 212, 0.4)',
    borderRadius: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 188, 212, 0.03)',
    marginTop: 10,
    gap: 12,
  },
  dashedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedButtonText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: '#00bcd4',
    fontWeight: '800',
  },
  desktopShell: { flex: 1 },
  desktopMain: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  desktopContent: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  desktopInner: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 24,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  largeTitleContainer: { flex: 1 },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  subtitleDesktop: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
  },
  desktopCreateButtonWrapper: { borderRadius: 16, overflow: 'hidden' },
  desktopCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  desktopCreateButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
