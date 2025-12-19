import React from 'react';
import { useData } from '../../context/DataContext';
import { ShoppingList } from '../ShoppingList';

export const ShoppingTab: React.FC = () => {
  const { shoppingItems, expenses, currentRate } = useData();

  return (
    <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
      <div className="max-w-4xl lg:max-w-7xl mx-auto w-full transition-all duration-500">
        <ShoppingList items={shoppingItems} expenses={expenses} currentRate={currentRate} />
      </div>
    </div>
  );
};
