import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { ItineraryItem } from '../types';
import { Icons } from './Icon';

interface Props {
  currentDayItems: ItineraryItem[];
  dayIndex: number;
}

export const MapComponent: React.FC<Props> = ({ currentDayItems, dayIndex }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Initial center: Kyoto Station
  const KYOTO_CENTER = { lat: 34.9858, lng: 135.7588 };

  // Kyoto Style JSON for Google Maps (Desaturated & Elegant)
  const MAP_STYLES = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
    { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
  ];

  // Simple HTML Escaping for XSS prevention
  const escapeHtml = (text: string) => {
    if (!text) return '';
    const map: {[key: string]: string} = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  useEffect(() => {
    // Attempt to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => console.log("Location access denied or failed")
      );
    }
  }, []);

  useEffect(() => {
    if (!(window as any).google || !(window as any).google.maps) {
      setMapError(true);
      return;
    }

    if (!mapRef.current) return;

    try {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: KYOTO_CENTER,
        zoom: 13,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        backgroundColor: '#F5F5F5',
      });

      // User Location Marker
      if (currentLocation) {
        new (window as any).google.maps.Marker({
          position: currentLocation,
          map: map,
          title: "現在位置",
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#1F3C5F",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          }
        });
      }

      // Itinerary Markers
      const bounds = new (window as any).google.maps.LatLngBounds();
      let hasPoints = false;

      currentDayItems.forEach((item, index) => {
         // Mock Geocoding Logic (pseudo-random spread for demo)
         // In real app, use Geocoding service
         const angle = (index * (360 / Math.max(currentDayItems.length, 1))) * (Math.PI / 180);
         const radius = 0.02 + (Math.random() * 0.01);
         const lat = KYOTO_CENTER.lat + (Math.sin(angle) * radius);
         const lng = KYOTO_CENTER.lng + (Math.cos(angle) * radius);

         const marker = new (window as any).google.maps.Marker({
           position: { lat, lng },
           map: map,
           title: item.location,
           label: {
             text: (index + 1).toString(),
             color: "white",
             fontWeight: "bold",
             fontFamily: "Noto Sans JP"
           },
           icon: {
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: "#183654", // Wafu Indigo
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 1,
              scale: 1.1,
              labelOrigin: new (window as any).google.maps.Point(0, -30)
           }
         });
         
         const infoWindow = new (window as any).google.maps.InfoWindow({
           content: `<div style="padding:4px; font-weight:bold; font-family: 'Noto Sans JP'; color:#333">${escapeHtml(item.location)}</div>`
         });
         
         marker.addListener("click", () => infoWindow.open(map, marker));
         bounds.extend({ lat, lng });
         hasPoints = true;
      });

      if (hasPoints) {
        map.fitBounds(bounds);
      }
      
    } catch (e) {
      console.error("Map initialization failed", e);
      setMapError(true);
    }
  }, [currentDayItems, currentLocation]);

  // Drag Scroll Logic for Bottom List
  const useDraggable = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    
    // NOTE: For the map list, we might not need to block clicks as aggressively 
    // since there are no functional buttons inside, but let's keep it consistent.
    const isDragging = useRef(false);

    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current) return;
      setIsDown(true);
      isDragging.current = false;
      setStartX(e.pageX - ref.current.offsetLeft);
      setScrollLeft(ref.current.scrollLeft);
    };
    
    const onMouseLeave = () => {
      setIsDown(false);
      setTimeout(() => { isDragging.current = false; }, 0);
    };
    
    const onMouseUp = () => {
      setIsDown(false);
      setTimeout(() => { isDragging.current = false; }, 0);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown || !ref.current) return;
      e.preventDefault();
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      ref.current.scrollLeft = scrollLeft - walk;
      
      if (Math.abs(x - startX) > 5) {
        isDragging.current = true;
      }
    };
    return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove, isDragging, className: "cursor-grab active:cursor-grabbing select-none no-scrollbar touch-pan-x" };
  };

  const listDrag = useDraggable();

  if (mapError) {
    return (
      <div className="h-full w-full bg-stone-100 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white p-6 rounded-full shadow-lg mb-5 text-stone-300">
          <Icons.MapPin />
        </div>
        <h3 className="font-serif font-bold text-stone-600 mb-3 text-lg">地圖暫時無法顯示</h3>
        <p className="text-sm text-stone-400 mb-8 max-w-xs leading-relaxed">請確認 Google Maps API Key 設定，或直接使用外部連結導航。</p>
        
        <div className="w-full max-w-xs space-y-3">
          {currentDayItems.map((item, idx) => (
            <a 
              key={item.id}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("京都 " + item.location)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-wafu-indigo hover:shadow-md transition-all group"
            >
              <span className="font-bold text-sm truncate text-wafu-text group-hover:text-wafu-indigo">
                <span className="text-wafu-indigo mr-2">{idx + 1}.</span>{item.location}
              </span>
              <span className="text-stone-300 group-hover:text-wafu-indigo"><Icons.Navigation /></span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Draggable Bottom List */}
      <div className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/40">
        <h4 className="text-xs font-bold text-wafu-indigo mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
          <span className="w-1.5 h-1.5 bg-wafu-indigo rounded-full"></span>
          今日景點導覽 ({currentDayItems.length})
        </h4>
        <div 
          ref={listDrag.ref}
          onMouseDown={listDrag.onMouseDown}
          onMouseLeave={listDrag.onMouseLeave}
          onMouseUp={listDrag.onMouseUp}
          onMouseMove={listDrag.onMouseMove}
          className={`flex gap-3 overflow-x-auto pb-1 ${listDrag.className}`}
        >
          {currentDayItems.map((item, i) => (
            <div 
              key={item.id} 
              className="shrink-0 w-40 p-3 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col gap-1 transition-transform hover:-translate-y-1"
              // Prevent click propagation if dragging
              onClick={(e) => {
                 if (listDrag.isDragging.current) {
                   e.preventDefault();
                   e.stopPropagation();
                 }
              }}
            >
               <div className="text-[10px] text-stone-400 font-bold uppercase">{item.category}</div>
               <div className="font-bold text-sm text-wafu-text truncate font-serif">
                 <span className="text-wafu-indigo mr-1">{i+1}.</span>{item.location}
               </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};