
import React from 'react';
import { Restaurant } from '../../types';
import { MapControls } from '../MapControls';
import { MapComponent } from '../MapComponent';
import { FoodList } from '../FoodList';

interface Props {
  items: Restaurant[];
  userLocation: { lat: number, lng: number } | null;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  focusedLocation: { lat: number, lng: number } | null;
  onFocus: (lat: number, lng: number) => void;
  onCenterUser: () => void;
  geoError?: string | null;
}

export const FoodTab: React.FC<Props> = ({
  items,
  userLocation,
  showMap,
  setShowMap,
  focusedLocation,
  onFocus,
  onCenterUser,
  geoError
}) => {
  return (
    <>
      <MapControls
        showMap={showMap}
        setShowMap={setShowMap}
        userLocation={userLocation}
        onCenterUser={onCenterUser}
        geoError={geoError}
      />

      {showMap && (
        <div className="w-full h-48 sm:h-56 lg:h-72 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
          <MapComponent items={items} userLocation={userLocation} focusedLocation={focusedLocation} />
        </div>
      )}

      <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
        <div className="max-w-3xl mx-auto w-full">
          <FoodList items={items} userLocation={userLocation} onFocus={onFocus} />
        </div>
      </div>
    </>
  );
};
