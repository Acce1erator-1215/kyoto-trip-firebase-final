import React, { createContext, useContext } from 'react';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { ItineraryItem, Expense, ShoppingItem, Restaurant, SightseeingSpot } from '../types';

interface DataContextType {
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  shoppingItems: ShoppingItem[];
  restaurants: Restaurant[];
  sightseeingSpots: SightseeingSpot[];
  dbError: boolean;
  currentRate: number;
  refreshRate: () => void;
  isRateLoading: boolean;
  rateLastUpdated: Date | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestoreData = useFirestoreData();
  const exchangeRateData = useExchangeRate();

  return (
    <DataContext.Provider
      value={{
        ...firestoreData,
        currentRate: exchangeRateData.currentRate,
        refreshRate: exchangeRateData.refresh,
        isRateLoading: exchangeRateData.isLoading,
        rateLastUpdated: exchangeRateData.lastUpdated,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};