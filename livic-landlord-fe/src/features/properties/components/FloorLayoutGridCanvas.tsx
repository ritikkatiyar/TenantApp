import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { UnitBlock } from '../hooks/useFloorLayoutViewer';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

const CELL_SIZE = 56;
const GRID_SIZE_X = 8;
const GRID_SIZE_Y = 8;

interface FloorLayoutGridCanvasProps {
  blocks: UnitBlock[];
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  resetTenantAssignmentForm: () => void;
  getBlockColorStyles: (block: UnitBlock) => { backgroundColor: string; borderColor: string; textColor: string };
  styles: any;
  theme: any;
}

export function FloorLayoutGridCanvas({
  blocks,
  selectedUnitId,
  setSelectedUnitId,
  resetTenantAssignmentForm,
  getBlockColorStyles,
  styles,
  theme,
}: FloorLayoutGridCanvasProps) {
  const gridCells: React.ReactNode[] = [];
  const occupiedGridMap: { [key: string]: boolean } = {};

  blocks.forEach((block) => {
    for (let x = block.gridX; x < block.gridX + block.gridWidth; x++) {
      for (let y = block.gridY; y < block.gridY + block.gridHeight; y++) {
        if (x !== block.gridX || y !== block.gridY) {
          occupiedGridMap[`${x},${y}`] = true;
        }
      }
    }
  });

  for (let y = 0; y < GRID_SIZE_Y; y++) {
    for (let x = 0; x < GRID_SIZE_X; x++) {
      if (occupiedGridMap[`${x},${y}`]) continue;

      const block = blocks.find((b) => b.gridX === x && b.gridY === y);

      gridCells.push(
        <View
          key={`${x}-${y}`}
          style={[
            styles.gridCell,
            {
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: (block ? block.gridWidth : 1) * CELL_SIZE,
              height: (block ? block.gridHeight : 1) * CELL_SIZE,
            },
            !block && styles.cellEmpty,
          ]}
          pointerEvents="box-none"
        >
          {block && (() => {
            const colorStyles = getBlockColorStyles(block);
            const isSelected = selectedUnitId === block.id;
            const activeCount = block.activeLeases ? block.activeLeases.length : 0;
            const cap = block.capacity || 1;
            const isVacant = activeCount === 0;

            return (
              <View
                style={{
                  position: 'absolute',
                  top: -1,
                  left: -1,
                  width: block.gridWidth * CELL_SIZE,
                  height: block.gridHeight * CELL_SIZE,
                  zIndex: isSelected ? 50 : 10,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedUnitId(block.id);
                    resetTenantAssignmentForm();
                  }}
                  style={[
                    styles.cellActive,
                    {
                      width: '100%',
                      height: '100%',
                      backgroundColor: colorStyles.backgroundColor,
                      borderColor: isSelected ? '#00e5ff' : colorStyles.borderColor,
                      borderWidth: isSelected ? 3 : 2,
                      justifyContent: 'space-between',
                      paddingVertical: block.gridHeight >= 2 ? 6 : 2,
                      paddingHorizontal: block.gridWidth >= 2 ? 6 : 2,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'column', gap: 1 }}>
                    <Text style={[styles.cellText, { color: colorStyles.textColor }]}>{block.unitNumber}</Text>
                    <Text
                      style={{
                        fontSize: theme.Typography.labelSmall.fontSize,
                        fontWeight: '700',
                        color: colorStyles.textColor + 'cc',
                      }}
                    >
                      {UNIT_TYPE_OPTIONS.find((opt) => opt.value === block.type)?.label || '1 BHK'}
                    </Text>
                  </View>

                  {block.gridWidth >= 2 || block.gridHeight >= 2 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'stretch',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 6,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        gap: theme.Spacing.xs,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: theme.Typography.labelSmall.fontSize,
                          fontWeight: '800',
                          color: theme.Colors.onSurface,
                        }}
                      >
                        {isVacant ? 'OPEN' : `${activeCount}/${cap}`}
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 4,
                        paddingHorizontal: theme.Spacing.xs,
                        paddingVertical: 2,
                        gap: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: theme.Typography.labelSmall.fontSize - 4,
                          fontWeight: '800',
                          color: theme.Colors.onSurface,
                        }}
                      >
                        {isVacant ? '—' : `${activeCount}/${cap}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      );
    }
  }

  return <>{gridCells}</>;
}
