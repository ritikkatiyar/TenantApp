import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

export interface PaginatedContainerProps<T> {
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  emptyState?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  itemGap?: number;
}

export function PaginatedContainer<T>({
  data,
  page = 0,
  totalPages = 1,
  onPageChange,
  onLoadMore,
  isLoadingMore = false,
  renderItem,
  keyExtractor,
  emptyState,
  containerStyle,
  itemGap,
}: PaginatedContainerProps<T>) {
  const { theme } = useAppTheme();
  const gap = itemGap !== undefined ? itemGap : theme.Spacing.md;

  if (!data || data.length === 0) {
    return <View style={containerStyle}>{emptyState || null}</View>;
  }

  const hasNextPage = page + 1 < totalPages;

  const handleNext = () => {
    if (onLoadMore) {
      onLoadMore();
    } else if (onPageChange && hasNextPage) {
      onPageChange(page + 1);
    }
  };

  return (
    <View style={containerStyle}>
      <View style={{ gap }}>
        {data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || String(index);
          return <View key={key}>{renderItem(item, index)}</View>;
        })}
      </View>

      {hasNextPage && (
        <View style={styles.loadMoreRow}>
          {isLoadingMore ? (
            <ActivityIndicator size="small" color={theme.Colors.primary} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              style={[styles.loadMoreBtn, { borderColor: theme.Colors.glassStroke, backgroundColor: theme.Colors.glassFill }]}
            >
              <Text style={[styles.loadMoreText, { color: theme.Colors.primary }]}>
                Show More ({data.length} loaded)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadMoreRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
