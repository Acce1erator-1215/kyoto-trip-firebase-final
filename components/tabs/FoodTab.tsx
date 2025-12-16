
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

      {/* RWD Map Height */}
      {showMap && (
        <div className="w-full h-48 sm:h-64 lg:h-96 xl:h-[450px] relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in transition-all duration-500">
          <MapComponent items={items} userLocation={userLocation} focusedLocation={focusedLocation} />
        </div>
      )}

      {/* RWD Container Width */}
      <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
        <div className="max-w-3xl lg:max-w-6xl mx-auto w-full transition-all duration-500">
          <FoodList items={items} userLocation={userLocation} onFocus={onFocus} />
        </div>
      </div>
    </>
  );
};
