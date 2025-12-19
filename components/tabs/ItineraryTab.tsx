import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useLocation } from '../../context/LocationContext';
import { useUI } from '../../context/UIContext';
import { DateSelector } from '../DateSelector';
import { MapControls } from '../MapControls';
import { MapComponent } from '../MapComponent';
import { Itinerary } from '../Itinerary';

export const ItineraryTab: React.FC = () => {
  const { itineraryItems } = useData();
  const { userLocation } = useLocation();
  const { showMap, setShowMap, focusedLocation, selectedDay, setSelectedDay, handleFocus } = useUI();

  const currentDayItems = useMemo(() => {
    return itineraryItems
      .filter(i => i.day === selectedDay && !i.deleted)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [itineraryItems, selectedDay]);

  const currentDayDeletedItems = useMemo(() => {
    return itineraryItems.filter(i => i.day === selectedDay && i.deleted);
  }, [itineraryItems, selectedDay]);

  return (
    <>
      <DateSelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} />

      <MapControls />

      {showMap && (
        <div className="w-full h-48 sm:h-64 lg:h-96 xl:h-[450px] relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in transition-all duration-500">
          <MapComponent items={currentDayItems} userLocation={userLocation} focusedLocation={focusedLocation} />
        </div>
      )}

      <div className="flex-1 pt-6 pb-32 bg-seigaiha bg-fixed bg-top">
        <div key={selectedDay} className="animate-fade-in-up-gentle max-w-3xl lg:max-w-4xl mx-auto w-full">
          <Itinerary
            dayIndex={selectedDay}
            items={currentDayItems}
            deletedItems={currentDayDeletedItems}
            isTodo={selectedDay === 0}
            userLocation={userLocation}
            onFocus={handleFocus}
          />
        </div>
      </div>
    </>
  );
};
