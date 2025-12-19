import React from 'react';
import { useData } from '../../context/DataContext';
import { ExpenseTracker } from '../ExpenseTracker';

export const ExpenseTab: React.FC = () => {
  const { expenses, currentRate, refreshRate, isRateLoading, rateLastUpdated } = useData();

  return (
    <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
      <div className="max-w-3xl lg:max-w-4xl mx-auto w-full transition-all duration-500">
        <ExpenseTracker
          expenses={expenses}
          currentRate={currentRate}
          refreshRate={refreshRate}
          isRateLoading={isRateLoading}
          rateLastUpdated={rateLastUpdated}
        />
      </div>
    </div>
  );
};
