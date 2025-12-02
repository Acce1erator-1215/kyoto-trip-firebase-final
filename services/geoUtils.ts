
/**
 * Calculates the distance between two coordinates in meters.
 * Uses the Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // in metres
  };
  
  /**
   * Formats a distance in meters to a human-readable string (m or km).
   */
  export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  /**
   * Attempts to extract latitude and longitude from a Google Maps URL.
   * Priority 1: !3d / !4d parameters (Exact marker location)
   * Priority 2: @lat,lng parameters (Viewport center)
   * Priority 3: q=lat,lng query parameters
   */
  export const parseCoordinatesFromUrl = (url: string): { lat: number, lng: number } | null => {
    try {
      // Priority 1: Data parameters !3d and !4d (Exact marker location)
      // Example: ...!3d34.9997865!4d135.7601172...
      const dataLatMatch = url.match(/!3d(-?\d+(\.\d+)?)/);
      const dataLngMatch = url.match(/!4d(-?\d+(\.\d+)?)/);

      if (dataLatMatch && dataLngMatch) {
        return {
          lat: parseFloat(dataLatMatch[1]),
          lng: parseFloat(dataLngMatch[1])
        };
      }

      // Priority 2: Viewport parameters @lat,lng
      // Note: This is often the center of the screen, not necessarily the pin
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(regex);
      
      if (match && match.length >= 3) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
      
      // Priority 3: Query param q=lat,lng (sometimes used for search results)
      const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const qMatch = url.match(qRegex);
      if (qMatch && qMatch.length >= 3) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2])
        };
      }
  
      return null;
    } catch (e) {
      console.warn("Failed to parse coordinates from URL", e);
      return null;
    }
  };
