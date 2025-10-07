export interface SpiceParameters {
  spiciness: number; // 辛さ (0-100)
  stimulation: number; // 刺激 (0-100)
  aroma: number; // 香り (0-100)
}

export interface CurryShop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  spiceParameters: SpiceParameters;
  rating: number;
  description?: string;
}

export interface UserPreferences {
  spiceParameters: SpiceParameters;
  favoriteShops: string[]; // Shop IDs
  dislikes: string[]; // Shop IDs
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  bio?: string;
  createdAt: string;
  isPublic: boolean; // Whether profile is visible to other users
}

export interface UserRegistration {
  username: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  bio?: string;
}