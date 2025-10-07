import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationState {
  lat: number;
  lng: number;
}

interface GeolocationHook {
  location: LocationState | null;
  error: string | null;
  isLoading: boolean;
  accuracy: number | null;
  lastUpdated: Date | null;
  refreshLocation: () => void;
  centerOnLocation: () => void;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  distanceThreshold?: number; // meters
  updateInterval?: number; // milliseconds
}

const useGeolocation = (options: GeolocationOptions = {}): GeolocationHook => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000, // 1分間キャッシュ
    watchPosition = true,
    distanceThreshold = 10, // 10m移動したら更新
    updateInterval = 30000, // 30秒間隔で最大チェック
  } = options;

  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationState | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const onLocationCenterRef = useRef<(() => void) | null>(null);

  // 距離計算関数（Haversine公式）
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // 位置情報更新の判定
  const shouldUpdateLocation = useCallback((position: GeolocationPosition): boolean => {
    const now = Date.now();
    const timeDiff = now - lastUpdateTimeRef.current;

    // 最小更新間隔チェック
    if (timeDiff < 5000) { // 5秒間隔
      return false;
    }

    // 精度チェック
    if (position.coords.accuracy > 100) { // 100m以上の誤差は無視
      return false;
    }

    // 距離チェック
    if (lastLocationRef.current) {
      const distance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        position.coords.latitude,
        position.coords.longitude
      );
      
      if (distance < distanceThreshold) {
        return false;
      }
    }

    return true;
  }, [calculateDistance, distanceThreshold]);

  // 位置情報処理
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    if (!shouldUpdateLocation(position)) {
      return;
    }

    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    setLocation(newLocation);
    setAccuracy(position.coords.accuracy);
    setLastUpdated(new Date());
    setError(null);
    setIsLoading(false);
    
    lastLocationRef.current = newLocation;
    lastUpdateTimeRef.current = Date.now();

  }, [shouldUpdateLocation]);

  // エラー処理
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = '位置情報の取得に失敗しました';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '位置情報の使用が拒否されました。ブラウザの設定を確認してください。';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '位置情報が利用できません。';
        break;
      case error.TIMEOUT:
        errorMessage = '位置情報の取得がタイムアウトしました。';
        break;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    console.error('Geolocation error:', errorMessage, error);
  }, []);

  // 位置情報取得開始
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('この環境では位置情報がサポートされていません');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // 初回取得
    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    );

    // 継続監視
    if (watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          ...options,
          maximumAge: 5000, // watch時は短いキャッシュ
        }
      );
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, handleLocationUpdate, handleLocationError]);

  // 位置情報手動更新
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setLocation(newLocation);
        setAccuracy(position.coords.accuracy);
        setLastUpdated(new Date());
        setError(null);
        setIsLoading(false);
        
        lastLocationRef.current = newLocation;
        lastUpdateTimeRef.current = Date.now();

      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // 強制的に新しい位置を取得
      }
    );
  }, [handleLocationError]);

  // 現在地へ移動
  const centerOnLocation = useCallback(() => {
    if (location && onLocationCenterRef.current) {
      onLocationCenterRef.current();
    } else if (!location) {
      refreshLocation();
    }
  }, [location, refreshLocation]);

  // コンポーネントマウント時に開始
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('この環境では位置情報がサポートされていません');
      setIsLoading(false);
      return;
    }
    
    startLocationTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLocationTracking]);

  // 定期的な更新チェック（バッテリー節約のため）
  useEffect(() => {
    if (!watchPosition) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // 長時間更新がない場合は手動で再取得
      if (timeSinceLastUpdate > updateInterval) {
        refreshLocation();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [watchPosition, updateInterval, refreshLocation]);

  return {
    location,
    error,
    isLoading,
    accuracy,
    lastUpdated,
    refreshLocation,
    centerOnLocation,
  };
};

export default useGeolocation;