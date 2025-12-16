
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
      <div className="max-w-4xl mx-auto w-full">
        <ShoppingList items={items} expenses={expenses} currentRate={currentRate} />
      </div>
    </div>
  );
};
