import { useState, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { inventoryItems, verificationItems } from '@/src/features/inventory/mockInventoryData';

export type InventoryTab = 'registry' | 'moveIn' | 'moveOut';

export function useInventory() {
  const params = useLocalSearchParams<{ tab?: string; leaseId?: string }>();
  const initialTab: InventoryTab =
    params.tab === 'moveIn' || params.tab === 'moveOut' ? params.tab : 'registry';
    
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [query, setQuery] = useState('');
  const [serviceOnly, setServiceOnly] = useState(false);

  const filteredItems = useMemo(
    () =>
      [...inventoryItems]
        .filter((item) => {
          const matchQ = `${item.name} ${item.location} ${item.category} ${item.serial}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
          return matchQ && (!serviceOnly || item.status === 'Service Due');
        })
        .sort((a, b) =>
          (a.location || '').localeCompare(b.location || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        ),
    [query, serviceOnly]
  );

  const totalDeductions = verificationItems.reduce((s, i) => s + i.deduction, 0);
  const securityDeposit = 30000;
  const netRefund       = securityDeposit - totalDeductions;

  return {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId: params.leaseId
  };
}
