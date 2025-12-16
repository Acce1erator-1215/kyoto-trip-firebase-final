
import React, { useState, useMemo } from 'react';
import { ItineraryItem } from '../../types';
import { DateSelector } from '../DateSelector';
import { MapControls } from '../MapControls';
import { MapComponent } from '../MapComponent';
import { Itinerary } from '../Itinerary';

interface Props {
  items: ItineraryItem[];
  userLocation: { lat: number, lng: number } | null;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  focusedLocation: { lat: number, lng: number } | null;
  onFocus: (lat: number, lng: number) => void;
  onCenterUser: () => void;
  geoError?: string | null;
}

export const ItineraryTab: React.FC<Props> = ({
  items,
  userLocation,
  showMap,
  setShowMap,
  focusedLocation,
  onFocus,
  onCenterUser,
  geoError
}) => {
  // 狀態下放：選擇的天數只與行程 Tab 有關
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // 邏輯下放：篩選當日行程
  const currentDayItems = useMemo(() => {
    return items
      .filter(i => i.day === selectedDay && !i.deleted)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [items, selectedDay]);

  const currentDayDeletedItems = useMemo(() => {
    return items.filter(i => i.day === selectedDay && i.deleted);
  }, [items, selectedDay]);

  return (
    <>
      <DateSelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} />

      <MapControls
        showMap={showMap}
        setShowMap={setShowMap}
        userLocation={userLocation}
        onCenterUser={onCenterUser}
        geoError={geoError}
      />

      {/* 地圖組件 - RWD Height: h-48 (Mobile) -> h-64 (Tablet) -> h-96 (Desktop) */}
      {showMap && (
        <div className="w-full h-48 sm:h-64 lg:h-96 xl:h-[450px] relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in transition-all duration-500">
          <MapComponent items={currentDayItems} userLocation={userLocation} focusedLocation={focusedLocation} />
        </div>
      )}

      {/* 行程列表 - Container width increased for desktop */}
      <div className="flex-1 pt-6 pb-32 bg-seigaiha bg-fixed bg-top">
        <div key={selectedDay} className="animate-fade-in-up-gentle max-w-3xl lg:max-w-4xl mx-auto w-full">
          <Itinerary
            dayIndex={selectedDay}
            items={currentDayItems}
            deletedItems={currentDayDeletedItems}
            isTodo={selectedDay === 0}
            userLocation={userLocation}
            onFocus={onFocus}
          />
        </div>
      </div>
    </>
  );
};
