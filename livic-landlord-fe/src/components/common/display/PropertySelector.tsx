import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import GlassDropdown, { DropdownOption } from '@/src/components/common/inputs/GlassDropdown';
import { useRouter } from 'expo-router';

export interface PropertySelectorProps {
  properties: Array<{ id: string; name: string }>;
  selectedPropertyId?: string | null;
  onSelectProperty: (propertyId: string) => void;
  label?: string;
  style?: ViewStyle;
}

export function PropertySelector({
  properties,
  selectedPropertyId,
  onSelectProperty,
  label,
  style,
}: PropertySelectorProps) {
  const router = useRouter();

  const options: DropdownOption[] = (properties || []).map((p) => ({
    label: p.name,
    value: p.id,
  }));

  if (options.length === 0) {
    options.push({ label: '+ Create Property', value: 'create_new_prop' });
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.dropdownWrap}>
        <GlassDropdown
          options={options}
          value={selectedPropertyId || (properties?.[0]?.id ?? null)}
          onChange={(val) => {
            if (val === 'create_new_prop') {
              router.push('/properties/create');
            } else {
              onSelectProperty(val);
            }
          }}
          placeholder="Select Property"
          icon="business"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0891b2',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownWrap: {
    minWidth: 200,
    maxWidth: 280,
  },
});
