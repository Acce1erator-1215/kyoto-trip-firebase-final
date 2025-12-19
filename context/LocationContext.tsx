import React, { createContext, useContext } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userLocation, error } = useGeolocation();

  return (
    <LocationContext.Provider value={{ userLocation, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
