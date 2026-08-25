import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getProperty, updateProperty } from '@/src/features/properties/api/property.api';
import { generateBatchUnits, getFloorSummaries } from '@/src/features/properties/api/unit.api';

interface UseEditPropertyProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
}

export function useEditProperty({ propertyId, userToken, onBack, onSave }: UseEditPropertyProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [globalUnitsPerFloor, setGlobalUnitsPerFloor] = useState('');
  const [globalUnitType, setGlobalUnitType] = useState('SINGLE_UNIT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfiguredFloor, setHasConfiguredFloor] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const data = await getProperty(propertyId, userToken);
      setName(data.name);
      setAddress(data.address);
      setCity(data.city);
      setLandmark(data.landmark || '');
      setTotalFloors(data.totalFloors?.toString() || '');
      setSelectedAmenities(data.amenities || ['High-speed Fiber Wi-Fi', 'Covered Parking', '24/7 Security', 'Power Backup']);
      
      const floorSummaries = await getFloorSummaries(propertyId, userToken);
      const isAnyConfigured = floorSummaries.some(f => f.configured);
      setHasConfiguredFloor(isAnyConfigured);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch property details');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleUpdate = async () => {
    if (!name || !address || !city || !totalFloors) {
      Alert.alert('Validation', 'Please fill in all required fields (Name, Address, City, Floors).');
      return;
    }

    if (parseInt(totalFloors, 10) < 1) {
      Alert.alert('Validation', 'Property must have at least 1 floor.');
      return;
    }

    setSaving(true);
    try {
      await updateProperty({
        propertyId,
        token: userToken,
        property: { 
          name, 
          address, 
          city, 
          landmark, 
          totalFloors: parseInt(totalFloors, 10),
          amenities: selectedAmenities
        }
      });

      if (!hasConfiguredFloor && globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0) {
        await generateBatchUnits(propertyId, {
          totalFloors: parseInt(totalFloors, 10),
          unitsPerFloor: parseInt(globalUnitsPerFloor, 10),
          startingFloorNumber: 1,
          prefix: '',
          capacity: 1,
          unitType: globalUnitType
        }, userToken);
      }

      Alert.alert('Success', 'Property updated successfully');
      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    address,
    setAddress,
    city,
    setCity,
    landmark,
    setLandmark,
    totalFloors,
    setTotalFloors,
    globalUnitsPerFloor,
    setGlobalUnitsPerFloor,
    globalUnitType,
    setGlobalUnitType,
    selectedAmenities,
    toggleAmenity,
    loading,
    saving,
    hasConfiguredFloor,
    handleUpdate,
    fetchPropertyDetails,
  };
}
