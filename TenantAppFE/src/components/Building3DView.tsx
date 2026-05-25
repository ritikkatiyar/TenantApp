import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, PanResponder } from 'react-native';
import { useRef } from 'react';
import { getAllFloorsLayout, UnitResponse } from '../api/unit.api';

interface Building3DViewProps {
  propertyId: string;
  token: string;
}

export default function Building3DView({ propertyId, token }: Building3DViewProps) {
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated values for 3D rotation
  const rotateZ = useRef(new Animated.Value(-45)).current;
  const rotateX = useRef(new Animated.Value(60)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Invert left/right rotation
        rotateZ.setValue(-45 - gestureState.dx * 0.5);
        
        let newRotX = 60 - gestureState.dy * 0.5;
        if (newRotX < 20) newRotX = 20;
        if (newRotX > 80) newRotX = 80;
        rotateX.setValue(newRotX);
      },
      onPanResponderRelease: () => {
        // Smooth GPU-accelerated spring back
        Animated.spring(rotateZ, {
          toValue: -45,
          useNativeDriver: true,
        }).start();
        Animated.spring(rotateX, {
          toValue: 60,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const spin = rotateZ.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const tilt = rotateX.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLayouts = async () => {
      try {
        const layout = await getAllFloorsLayout(propertyId, token);
        if (isMounted) {
          setUnits(layout);
        }
      } catch (error) {
        console.error('Failed to fetch layouts for 3D building:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLayouts();
    return () => {
      isMounted = false;
    };
  }, [propertyId, token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#00e5ff" />
      </View>
    );
  }

  if (!units || units.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Layout</Text>
      </View>
    );
  }

  // Group units by floor and calculate bounding box
  let minX = 999, maxX = 0, minY = 999, maxY = 0;
  const floors = units.reduce((acc, unit) => {
    if (unit.gridX < minX) minX = unit.gridX;
    if (unit.gridX + unit.gridWidth - 1 > maxX) maxX = unit.gridX + unit.gridWidth - 1;
    if (unit.gridY < minY) minY = unit.gridY;
    if (unit.gridY + unit.gridHeight - 1 > maxY) maxY = unit.gridY + unit.gridHeight - 1;

    if (!acc[unit.floor]) acc[unit.floor] = [];
    acc[unit.floor].push(unit);
    return acc;
  }, {} as Record<number, UnitResponse[]>);

  const gridW = maxX - minX + 1;
  const gridH = maxY - minY + 1;

  // Dynamically calculate cell size so the building always fills the available card space
  const TARGET_WIDTH = 260; 
  const rawIsoWidth = (gridW + gridH) * 0.707;
  let dynamicCellSize = Math.floor(TARGET_WIDTH / rawIsoWidth);

  // Clamp sizes
  if (dynamicCellSize > 25) dynamicCellSize = 25;
  if (dynamicCellSize < 6) dynamicCellSize = 6;
  
  const dynamicFloorHeight = dynamicCellSize * 3.5;

  const buildingWidth = gridW * dynamicCellSize;
  const buildingHeight = gridH * dynamicCellSize;

  // Get sorted floor numbers
  const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => a - b);
  const minFloor = floorNumbers.length > 0 ? floorNumbers[0] : 1;
  const stackHeightOffset = (floorNumbers.length > 0 ? floorNumbers.length - 1 : 0) * dynamicFloorHeight;

  // Mathematically calculate the visual height of the isometric projection
  const visualIsoHeight = (gridW + gridH) * dynamicCellSize * 0.5;
  const containerHeight = visualIsoHeight + stackHeightOffset + 20;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: buildingWidth + 40,
          height: containerHeight
        }
      ]}
      {...panResponder.panHandlers}
    >
      {floorNumbers.map((floorNum) => (
        <View
          key={`floor-${floorNum}`}
          style={{
            position: 'absolute',
            zIndex: floorNum, // Higher floors should render on top
            transform: [
              // Elevate each floor, but shift everything down by half the stack height to perfectly center it
              { translateY: -(floorNum - minFloor) * dynamicFloorHeight + (stackHeightOffset / 2) },
            ],
          }}
        >
          {/* 3D Slab Thickness Extrusion (layer stacking) */}
          {Array.from({ length: 4 }).map((_, idx) => (
            <Animated.View
              key={`floor-slab-extrusion-${floorNum}-${idx}`}
              style={[
                styles.isometricWrapper,
                styles.slabExtrusion,
                {
                  position: 'absolute',
                  zIndex: -1 - idx, // Render behind/below the units
                  width: buildingWidth,
                  height: buildingHeight,
                  transform: [{ rotateX: tilt }, { rotateZ: spin }],
                  top: (idx + 1) * 1.5, // Translate downward on screen
                  opacity: 0.9 - idx * 0.15,
                }
              ]}
            />
          ))}

          {/* Main Floor Plate & Units */}
          <Animated.View 
            style={[
              styles.isometricWrapper, 
              { 
                width: buildingWidth,
                height: buildingHeight,
                transform: [{ rotateX: tilt }, { rotateZ: spin }] 
              }
            ]}
          >
            <View style={styles.floorLayer}>
              {floors[floorNum].map((unit) => {
                // Dynamically offset units so the building starts at 0,0 inside the wrapper
                const left = (unit.gridX - minX) * dynamicCellSize;
                const top = (unit.gridY - minY) * dynamicCellSize;
                const width = unit.gridWidth * dynamicCellSize;
                const height = unit.gridHeight * dynamicCellSize;

                // Check if unit has active leases
                const isOccupied = unit.activeLeases && unit.activeLeases.length > 0;
                const unitColor = isOccupied ? 'rgba(0, 212, 255, 0.95)' : 'rgba(0, 229, 255, 0.4)';
                const borderColor = isOccupied ? '#00e5ff' : 'rgba(0, 229, 255, 0.8)';

                return (
                  <View
                    key={unit.id}
                    style={[
                      styles.unitBlock,
                      {
                        left,
                        top,
                        width,
                        height,
                        backgroundColor: unitColor,
                        borderColor: borderColor,
                        borderWidth: 1.5,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible', // Ensure the 3D stack doesn't clip at the top
  },
  loadingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#6b7a7d',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  isometricWrapper: {
    // Width and height are set dynamically inline
  },
  floorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 5,
  },
  unitBlock: {
    position: 'absolute',
    borderWidth: 0.5,
    borderRadius: 1,
  },
  slabExtrusion: {
    backgroundColor: 'rgba(0, 60, 70, 0.4)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 2,
  },
});
