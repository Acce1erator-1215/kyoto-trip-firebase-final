import React, { createContext, useContext, useState } from 'react';
import { Tab } from '../components/BottomNavigation';

interface UIContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  focusedLocation: { lat: number; lng: number } | null;
  setFocusedLocation: (location: { lat: number; lng: number } | null) => void;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  handleFocus: (lat: number, lng: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');
  const [showMap, setShowMap] = useState<boolean>(true);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const handleFocus = (lat: number, lng: number) => {
    if (!showMap) setShowMap(true);
    setFocusedLocation({ lat, lng });
  };

  return (
    <UIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        showMap,
        setShowMap,
        focusedLocation,
        setFocusedLocation,
        selectedDay,
        setSelectedDay,
        handleFocus,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
