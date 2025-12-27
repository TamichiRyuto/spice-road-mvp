import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  isValidJapanCoordinate,
  calculateDistance,
  normalizeCoordinates
} from './coordinates';

describe('Coordinate Validation Utilities', () => {
  describe('validateLatitude', () => {
    it('should accept valid latitude values', () => {
      expect(validateLatitude(0)).toBe(true);
      expect(validateLatitude(34.6775)).toBe(true); // Nara
      expect(validateLatitude(90)).toBe(true);
      expect(validateLatitude(-90)).toBe(true);
    });

    it('should reject invalid latitude values', () => {
      expect(validateLatitude(91)).toBe(false);
      expect(validateLatitude(-91)).toBe(false);
      expect(validateLatitude(NaN)).toBe(false);
      expect(validateLatitude(Infinity)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should accept valid longitude values', () => {
      expect(validateLongitude(0)).toBe(true);
      expect(validateLongitude(135.8328)).toBe(true); // Nara
      expect(validateLongitude(180)).toBe(true);
      expect(validateLongitude(-180)).toBe(true);
    });

    it('should reject invalid longitude values', () => {
      expect(validateLongitude(181)).toBe(false);
      expect(validateLongitude(-181)).toBe(false);
      expect(validateLongitude(NaN)).toBe(false);
      expect(validateLongitude(Infinity)).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinate pairs', () => {
      expect(validateCoordinates(34.6775, 135.8328)).toBe(true); // Nara
      expect(validateCoordinates(0, 0)).toBe(true); // Null Island
    });

    it('should reject invalid coordinate pairs', () => {
      expect(validateCoordinates(91, 135.8328)).toBe(false);
      expect(validateCoordinates(34.6775, 181)).toBe(false);
      expect(validateCoordinates(NaN, 135.8328)).toBe(false);
    });

    it('should detect swapped coordinates', () => {
      // If lat/lng are swapped, validation should fail
      expect(validateCoordinates(135.8328, 34.6775)).toBe(false);
    });
  });

  describe('isValidJapanCoordinate', () => {
    it('should accept coordinates within Japan', () => {
      expect(isValidJapanCoordinate(34.6775, 135.8328)).toBe(true); // Nara
      expect(isValidJapanCoordinate(35.6762, 139.6503)).toBe(true); // Tokyo
      expect(isValidJapanCoordinate(43.0642, 141.3469)).toBe(true); // Sapporo
    });

    it('should reject coordinates outside Japan', () => {
      expect(isValidJapanCoordinate(0, 0)).toBe(false); // Null Island
      expect(isValidJapanCoordinate(40.7128, -74.0060)).toBe(false); // New York
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance correctly', () => {
      // Distance from Nara to Tokyo (approximately 370km)
      const distance = calculateDistance(34.6775, 135.8328, 35.6762, 139.6503);
      expect(distance).toBeGreaterThan(350000); // 350km
      expect(distance).toBeLessThan(400000); // 400km
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(34.6775, 135.8328, 34.6775, 135.8328);
      expect(distance).toBe(0);
    });
  });

  describe('normalizeCoordinates', () => {
    it('should return coordinates in [lat, lng] order', () => {
      const result = normalizeCoordinates({ lat: 34.6775, lng: 135.8328 });
      expect(result).toEqual([34.6775, 135.8328]);
    });

    it('should handle latitude/longitude keys', () => {
      const result = normalizeCoordinates({ latitude: 34.6775, longitude: 135.8328 });
      expect(result).toEqual([34.6775, 135.8328]);
    });

    it('should throw error for invalid input', () => {
      expect(() => normalizeCoordinates({ lat: 91, lng: 135.8328 })).toThrow();
      expect(() => normalizeCoordinates({ lat: 34.6775, lng: 181 })).toThrow();
    });
  });
});
