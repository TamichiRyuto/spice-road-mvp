export const API_ENDPOINTS = {
  SHOPS: '/api/shops',
  USERS: '/api/users',
  USER_REGISTER: '/api/users/register',
} as const;

export const GEOLOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 30000, // GPS取得に十分な時間を確保
  maximumAge: 0, // 常に最新の位置情報を取得（キャッシュを使わない）
  watchPosition: true,
  distanceThreshold: 10, // 10m移動したら更新
  updateInterval: 60000, // 60秒間隔で最大チェック
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
