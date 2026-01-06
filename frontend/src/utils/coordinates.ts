/**
 * Coordinate validation and utility functions
 */

/**
 * Validates latitude value (-90 to 90)
 */
export function validateLatitude(lat: number): boolean {
  return !isNaN(lat) && isFinite(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates longitude value (-180 to 180)
 */
export function validateLongitude(lng: number): boolean {
  return !isNaN(lng) && isFinite(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates a coordinate pair (latitude, longitude)
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return validateLatitude(lat) && validateLongitude(lng);
}

/**
 * Checks if coordinates are within Japan's bounding box
 * Japan rough bounds: lat 24-46, lng 123-146
 */
export function isValidJapanCoordinate(lat: number, lng: number): boolean {
  if (!validateCoordinates(lat, lng)) {
    return false;
  }
  return lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146;
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Normalizes coordinate objects to [lat, lng] array
 * Accepts objects with lat/lng or latitude/longitude keys
 */
export function normalizeCoordinates(
  coords:
    | { lat: number; lng: number }
    | { latitude: number; longitude: number }
): [number, number] {
  let lat: number;
  let lng: number;

  if ('lat' in coords && 'lng' in coords) {
    lat = coords.lat;
    lng = coords.lng;
  } else if ('latitude' in coords && 'longitude' in coords) {
    lat = coords.latitude;
    lng = coords.longitude;
  } else {
    throw new Error('Invalid coordinate object');
  }

  if (!validateCoordinates(lat, lng)) {
    throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }

  return [lat, lng];
}
