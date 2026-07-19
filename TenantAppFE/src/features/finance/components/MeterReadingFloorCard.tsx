import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MeterReadingResponse } from '@/src/features/finance/api/meterReading.api';

interface MeterReadingFloorCardProps {
  floor: number;
  isExpanded: boolean;
  toggleFloor: () => void;
  floorUnits: MeterReadingResponse[];
  currentPage: number;
  setPage: (page: number) => void;
  inputs: Record<string, string>;
  setInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  prevInputs: Record<string, string>;
  setPrevInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  inputRefs: React.MutableRefObject<Record<string, TextInput | null>>;
  baseRate: number;
  unitType: string | undefined;
}

export function MeterReadingFloorCard({
  floor,
  isExpanded,
  toggleFloor,
  floorUnits,
  currentPage,
  setPage,
  inputs,
  setInputs,
  prevInputs,
  setPrevInputs,
  inputRefs,
  baseRate,
  unitType,
}: MeterReadingFloorCardProps) {
  const unitsPerFloorPage = 4;
  const totalFloorPagesUnits = Math.ceil(floorUnits.length / unitsPerFloorPage);
  const startIndex = (currentPage - 1) * unitsPerFloorPage;
  const paginatedUnits = floorUnits.slice(startIndex, startIndex + unitsPerFloorPage);

  return (
    <BlurView intensity={60} tint="light" style={styles.floorCard}>
      <TouchableOpacity 
        style={styles.floorHeader}
        onPress={toggleFloor}
        activeOpacity={0.7}
      >
        <Text style={styles.floorHeaderText}>
          {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
        </Text>
        <MaterialIcons 
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color="#006875" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <>
          {paginatedUnits.map((row, index) => {
            const currentVal = inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null;
            const consumed = currentVal !== null ? currentVal - row.previousReading : 0;
            const isError = currentVal !== null && currentVal < row.previousReading;
            const estCost = consumed > 0 ? consumed * baseRate : 0;
            const isLast = index === paginatedUnits.length - 1;
            
            return (
              <View key={row.id} style={[styles.rowCard, isError && styles.rowError, isLast && { borderBottomWidth: 0 }]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.unitName}>{row.unitName}</Text>
                  <Text style={styles.tenantName}>{row.tenantName}</Text>
                  {!row.isBilled ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={[styles.prevReading, { marginRight: 4 }]}>Prev:</Text>
                      <TextInput
                        style={styles.prevTextInput}
                        keyboardType="decimal-pad"
                        value={prevInputs[row.unitId]}
                        onChangeText={(val) => setPrevInputs(prev => ({ ...prev, [row.unitId]: val }))}
                      />
                    </View>
                  ) : (
                    <Text style={styles.prevReading}>Prev: {row.previousReading}</Text>
                  )}
                </View>
                
                <View style={styles.rowMiddle}>
                  {currentVal !== null && (
                    <>
                      <Text style={[styles.consumedText, isError && { color: '#ef4444' }]}>
                        {consumed > 0 ? '+' : ''}{consumed} {unitType || 'Units'}
                      </Text>
                      {!isError && <Text style={styles.costText}>Est: ₹{estCost.toFixed(2)}</Text>}
                    </>
                  )}
                </View>
                
                <View style={styles.rowRight}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <TextInput
                      ref={(ref) => { inputRefs.current[row.unitId] = ref; }}
                      style={[styles.input, isError && styles.inputError, { flex: 1 }]}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#a0aab2"
                      value={inputs[row.unitId]}
                      onChangeText={(val) => setInputs(prev => ({ ...prev, [row.unitId]: val }))}
                      returnKeyType="next"
                      editable={!row.isBilled}
                    />
                    <Text style={styles.unitTypeLabel}>
                      {unitType || 'Units'}
                    </Text>
                  </View>
                  {isError && <Text style={styles.errorText}>Invalid</Text>}
                </View>
              </View>
            );
          })}

          {totalFloorPagesUnits > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                disabled={currentPage === 1}
                onPress={() => setPage(currentPage - 1)}
              >
                <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#a0aab2' : '#006875'} />
                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfoText}>
                Page {currentPage} of {totalFloorPagesUnits}
              </Text>
              
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === totalFloorPagesUnits && styles.pageButtonDisabled]}
                disabled={currentPage === totalFloorPagesUnits}
                onPress={() => setPage(currentPage + 1)}
              >
                <Text style={[styles.pageButtonText, currentPage === totalFloorPagesUnits && styles.pageButtonTextDisabled]}>Next</Text>
                <MaterialIcons name="chevron-right" size={20} color={currentPage === totalFloorPagesUnits ? '#a0aab2' : '#006875'} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  floorCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  floorHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#163235',
    fontFamily: 'Inter',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 104, 117, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  rowError: {
    backgroundColor: 'rgba(186, 26, 26, 0.04)',
  },
  rowLeft: {
    flex: 1.5,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#163235',
    fontFamily: 'Inter',
  },
  tenantName: {
    fontSize: 12,
    color: '#6b7a7d',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  prevReading: {
    fontSize: 12,
    color: '#6b7a7d',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  prevTextInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    width: 70,
    color: '#163235',
    fontWeight: '600',
  },
  rowMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2e7d32',
    fontFamily: 'Inter',
  },
  costText: {
    fontSize: 11,
    color: '#6b7a7d',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  rowRight: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#163235',
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#ba1a1a',
    backgroundColor: 'rgba(186, 26, 26, 0.05)',
  },
  unitTypeLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#5b6b6d',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 10,
    color: '#ba1a1a',
    fontWeight: '700',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 104, 117, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.04)',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    fontFamily: 'Inter',
  },
  pageButtonTextDisabled: {
    color: '#a0aab2',
  },
  pageInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7a7d',
    fontFamily: 'Inter',
  },
});
