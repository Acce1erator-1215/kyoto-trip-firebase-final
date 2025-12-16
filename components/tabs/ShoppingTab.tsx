
import React from 'react';
import { ShoppingItem, Expense } from '../../types';
import { ShoppingList } from '../ShoppingList';

interface Props {
  items: ShoppingItem[];
  expenses: Expense[];
  currentRate: number;
}

export const ShoppingTab: React.FC<Props> = ({ items, expenses, currentRate }) => {
  return (
    <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
      <div className="max-w-4xl lg:max-w-7xl mx-auto w-full transition-all duration-500">
        <ShoppingList items={items} expenses={expenses} currentRate={currentRate} />
      </div>
    </div>
  );
};
