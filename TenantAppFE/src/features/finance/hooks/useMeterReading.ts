import { useState, useEffect, useRef } from 'react';
import { Alert, TextInput } from 'react-native';
import { getActiveChargesForProperty, ChargeConfigResponse } from '@/src/features/finance/api/charge.api';
import { getWorksheet, batchSaveReadings, MeterReadingResponse } from '@/src/features/finance/api/meterReading.api';

interface UseMeterReadingProps {
  token: string | null;
  propertyId: string | undefined;
}

export function useMeterReading({ token, propertyId }: UseMeterReadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [configs, setConfigs] = useState<ChargeConfigResponse[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [worksheet, setWorksheet] = useState<MeterReadingResponse[]>([]);
  
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [prevInputs, setPrevInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [floorPages, setFloorPages] = useState<Record<number, number>>({});
  const [floorPage, setFloorPage] = useState(1);

  const toggleFloor = (floor: number) => {
    setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  useEffect(() => {
    if (token && propertyId) {
      loadConfigs();
    }
  }, [token, propertyId]);

  useEffect(() => {
    if (selectedConfigId && token && propertyId) {
      loadWorksheet();
      setFloorPages({});
      setFloorPage(1);
    }
  }, [selectedConfigId, month, year, token, propertyId]);

  useEffect(() => {
    if (worksheet.length > 0) {
      setExpandedFloors({});
      setFloorPages({});
      setFloorPage(1);
    }
  }, [worksheet]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const allCharges = await getActiveChargesForProperty(propertyId as string, token as string);
      const meteredCharges = allCharges.filter(c => c.calculationStrategy === 'METERED');
      setConfigs(meteredCharges);
      if (meteredCharges.length > 0) {
        setSelectedConfigId(meteredCharges[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", "Failed to load utility configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorksheet = async () => {
    if (!selectedConfigId || !token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await getWorksheet(propertyId as string, selectedConfigId, month, year, token);
      setWorksheet(data);
      
      const newInputs: Record<string, string> = {};
      const newPrevInputs: Record<string, string> = {};
      data.forEach(item => {
        newInputs[item.unitId] = item.currentReading ? item.currentReading.toString() : '';
        newPrevInputs[item.unitId] = item.previousReading != null ? item.previousReading.toString() : '0';
      });
      setInputs(newInputs);
      setPrevInputs(newPrevInputs);
    } catch (e: any) {
      Alert.alert("Error", "Failed to load worksheet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedConfigId || !token || !propertyId) return;
    
    let hasErrors = false;
    
    worksheet.forEach(row => {
      const valStr = inputs[row.unitId];
      const prevValStr = prevInputs[row.unitId];
      const prevVal = prevValStr ? parseFloat(prevValStr) : 0;
      if (valStr) {
        const val = parseFloat(valStr);
        if (val < prevVal) {
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      Alert.alert("Validation Error", "One or more entries are less than the previous reading. Please correct them before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const readingsToSave = worksheet.map(row => ({
        unitId: row.unitId,
        previousReading: prevInputs[row.unitId] ? parseFloat(prevInputs[row.unitId]) : row.previousReading,
        currentReading: inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null
      }));

      await batchSaveReadings({
        propertyId: propertyId as string,
        chargeConfigId: selectedConfigId,
        billingMonth: month,
        billingYear: year,
        readings: readingsToSave
      }, token);

      Alert.alert("Success", "Readings saved successfully!");
    } catch (e: any) {
      Alert.alert("Error", "Failed to save readings.");
    } finally {
      setIsSaving(false);
    }
  };

  const changeMonth = (delta: number) => {
    let newM = month + delta;
    let newY = year;
    if (newM > 12) { newM = 1; newY++; }
    if (newM < 1) { newM = 12; newY--; }
    setMonth(newM);
    setYear(newY);
  };

  return {
    isLoading,
    isSaving,
    configs,
    selectedConfigId,
    setSelectedConfigId,
    month,
    year,
    worksheet,
    inputs,
    setInputs,
    prevInputs,
    setPrevInputs,
    inputRefs,
    expandedFloors,
    setExpandedFloors,
    floorPages,
    setFloorPages,
    floorPage,
    setFloorPage,
    toggleFloor,
    handleSave,
    changeMonth,
  };
}
