import React from 'react';
import { useData } from '../../context/DataContext';
import { useLocation } from '../../context/LocationContext';
import { useUI } from '../../context/UIContext';
import { MapControls } from '../MapControls';
import { MapComponent } from '../MapComponent';
import { SightseeingList } from '../SightseeingList';

export const SightseeingTab: React.FC = () => {
  const { sightseeingSpots } = useData();
  const { userLocation } = useLocation();
  const { showMap, focusedLocation, handleFocus } = useUI();

  return (
    <>
      <MapControls />

      {showMap && (
        <div className="w-full h-48 sm:h-64 lg:h-96 xl:h-[450px] relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in transition-all duration-500">
          <MapComponent items={sightseeingSpots} userLocation={userLocation} focusedLocation={focusedLocation} />
        </div>
      )}

      <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
        <div className="max-w-3xl lg:max-w-6xl mx-auto w-full transition-all duration-500">
          <SightseeingList items={sightseeingSpots} userLocation={userLocation} onFocus={handleFocus} />
        </div>
      </div>
    </>
  );
};
