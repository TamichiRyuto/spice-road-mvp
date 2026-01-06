// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spice-road-mvp-cpp-api-dev-gpxy5envpq-dt.a.run.app';

export const API_ENDPOINTS = {
  SHOPS: `${API_BASE_URL}/api/shops`,
  USERS: `${API_BASE_URL}/api/users`,
  USER_REGISTER: `${API_BASE_URL}/api/users/register`,
} as const;

export const UI_CONFIG = {
  SCROLL_DELAY: 100,
  ANIMATION_DURATION: 300,
  MAX_PROFILES_HEIGHT: 400,
} as const;

// Fallback shop data for when API fails
export const FALLBACK_SHOPS = [
  {
    id: '1',
    name: '菩薩咖喱',
    address: '奈良県奈良市薬師堂町21',
    latitude: 34.676154,
    longitude: 135.831229,
    spiceParameters: {
      spiciness: 60,
      stimulation: 45,
      aroma: 85
    },
    rating: 4.6,
    description: '奈良市初のダルバート専門店。御霊神社すぐ東の古民家で野菜たっぷりのスパイスカレーを提供'
  },
  {
    id: '2',
    name: 'ハチノス',
    address: '奈良県奈良市南市町8-1 古古古屋1階',
    latitude: 34.679894,
    longitude: 135.830062,
    spiceParameters: {
      spiciness: 70,
      stimulation: 75,
      aroma: 80
    },
    rating: 4.4,
    description: 'ならまちの薬膳スパイススープカレーと蜂蜜の店。身体に優しいスパイス使いが評判'
  },
  {
    id: '3',
    name: '若草カレー本舗',
    address: '奈良県奈良市餅飯殿町38-1',
    latitude: 34.680776,
    longitude: 135.828896,
    spiceParameters: {
      spiciness: 55,
      stimulation: 50,
      aroma: 75
    },
    rating: 4.2,
    description: '近鉄奈良駅から徒歩3分のもちいどのセンター街にある人気のカレー店。ほうれん草やトマトなど野菜たっぷりのヘルシーなカレーが自慢'
  }
] as const;
