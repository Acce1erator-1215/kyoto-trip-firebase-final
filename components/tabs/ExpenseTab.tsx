
import React from 'react';
import { Expense } from '../../types';
import { ExpenseTracker } from '../ExpenseTracker';

interface Props {
  expenses: Expense[];
  currentRate: number;
  refreshRate: () => void;
  isRateLoading: boolean;
  rateLastUpdated: Date | null;
}

export const ExpenseTab: React.FC<Props> = ({
  expenses,
  currentRate,
  refreshRate,
  isRateLoading,
  rateLastUpdated
}) => {
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
