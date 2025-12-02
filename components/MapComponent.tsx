import React, { useEffect, useRef } from 'react';
import { ItineraryItem, Restaurant, SightseeingSpot } from '../types';

// Using Leaflet from global scope (added in index.html)
declare const L: any;

interface Props {
  items: (ItineraryItem | Restaurant | SightseeingSpot)[];
  userLocation: { lat: number, lng: number } | null;
  focusedLocation?: { lat: number, lng: number } | null;
}

export const MapComponent: React.FC<Props> = ({ items, userLocation, focusedLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const itemMarkersRef = useRef<any[]>([]);

  // Default: Kyoto Station
  const KYOTO_CENTER = { lat: 34.9858, lng: 135.7588 };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    try {
        const map = L.map(mapContainerRef.current, {
            center: [KYOTO_CENTER.lat, KYOTO_CENTER.lng],
            zoom: 13,
            zoomControl: false, // Cleaner look
            attributionControl: false,
            dragging: true
            // Removed tap: true as it causes issues in modern browsers
        });

        // OpenStreetMap Layer (Free) with cache busting
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?v=2', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);

        // Add Zoom control to bottom right to not obstruct header
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
    } catch (e) {
        console.error("Leaflet init error:", e);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Update Itinerary Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    itemMarkersRef.current.forEach(m => m.remove());
    itemMarkersRef.current = [];

    // bounds to fit
    const bounds = L.latLngBounds([]);

    // Filter items: MUST have lat, lng, AND mapsUrl
    const validItems = items.filter(item => item.lat && item.lng && item.mapsUrl);

    validItems.forEach((item, index) => {
        const lat = item.lat!;
        const lng = item.lng!;
        
        // Determine name (Itinerary has location, others have name)
        const title = (item as any).location || (item as any).name || '地點';

        // Custom Icon
        const markerIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `
              <div style="
                background-color: #183654; 
                color: white; 
                width: 28px; 
                height: 28px; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                border: 2px solid white;
              ">
                <span style="transform: rotate(45deg); font-weight: bold; font-family: 'Shippori Mincho'; font-size: 12px;">${index + 1}</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`
                <div style="font-family: 'Noto Sans JP'; min-width: 150px;">
                    <div style="font-weight: bold; color: #183654; margin-bottom: 4px;">${title}</div>
                    ${item.mapsUrl ? `<a href="${item.mapsUrl}" target="_blank" style="display: inline-block; background: #183654; color: white; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Google Maps</a>` : ''}
                </div>
            `);
        
        itemMarkersRef.current.push(marker);
        bounds.extend([lat, lng]);
    });

    if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
    }

    // Only auto-fit if we are NOT focusing on a specific location
    // OR if this is the initial load/update
    if (!focusedLocation) {
        if (itemMarkersRef.current.length > 0 || userLocation) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }

  }, [items, userLocation]); // Re-run when items change

  // Handle Focus Effect
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !focusedLocation) return;

      map.flyTo([focusedLocation.lat, focusedLocation.lng], 16, {
          animate: true,
          duration: 1.5
      });

  }, [focusedLocation]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    
    // User Location Icon (Blue Dot)
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
            <div style="
                width: 16px; 
                height: 16px; 
                background-color: #3B82F6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                position: relative;
            ">
               <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
            </div>
            <style>
               @keyframes pulse {
                   0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                   100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
               }
            </style>
        `,
        iconSize: [16, 16],
    });

    if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  // Stop propagation to prevent parent draggable scroll from interfering
  const stopPropagation = (e: React.SyntheticEvent | React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 relative"
        style={{background: '#f5f5f5'}} 
        // Intercept events to prevent parent drag logic
        // Only blocking START events is enough to prevent parent drag
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
        // Removed Move/Wheel blocks to allow Leaflet to handle drag/zoom
      />
    </>
  );
};