import React, { createContext, useContext, useState } from 'react';

interface PropertySelectionContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const PropertySelectionContext = createContext<PropertySelectionContextType>({
  selectedPropertyId: null,
  setSelectedPropertyId: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
});

export function PropertySelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PropertySelectionContext.Provider
      value={{ selectedPropertyId, setSelectedPropertyId, searchQuery, setSearchQuery }}
    >
      {children}
    </PropertySelectionContext.Provider>
  );
}

export function useGlobalPropertySelection() {
  return useContext(PropertySelectionContext);
}
