import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useGeolocation from './useGeolocation';

describe('useGeolocation', () => {
  let mockGeolocation: {
    getCurrentPosition: ReturnType<typeof vi.fn>;
    watchPosition: ReturnType<typeof vi.fn>;
    clearWatch: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    // Geolocation APIのモックをセットアップ
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('正常系: 位置情報の取得', () => {
    it('初回マウント時に正しい位置情報を取得する', async () => {
      // テスト用の正確な座標（奈良の座標）
      const expectedPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20, // 良好な精度
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      // getCurrentPositionが呼ばれたら成功コールバックを即座に実行
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => success(expectedPosition), 10);
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: false })
      );

      // タイマーを進めてsetTimeoutを実行
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // 正しい座標が設定されていることを確認
      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });
      expect(result.current.accuracy).toBe(20);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('初回取得時に低精度の位置情報でも受け入れる', async () => {
      // 低精度だが許容範囲内の位置情報
      const lowAccuracyPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 80, // 低精度だが100m未満
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => success(lowAccuracyPosition), 10);
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: false })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // 低精度でも初回は受け入れる
      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });
      expect(result.current.accuracy).toBe(80);
      expect(result.current.isLoading).toBe(false);
    });

    it('watchPosition有効時に位置情報を継続監視する', async () => {
      const initialPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => success(initialPosition), 10);
        }
      );

      mockGeolocation.watchPosition.mockReturnValue(1);

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // watchPositionが呼ばれていることを確認
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });
    });

    it('refreshLocation実行時に最新の位置情報を取得する', async () => {
      const initialPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      const updatedPosition = {
        coords: {
          latitude: 34.6800,
          longitude: 135.8350,
          accuracy: 15,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      let callCount = 0;
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => {
            success(callCount === 0 ? initialPosition : updatedPosition);
            callCount++;
          }, 10);
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });

      // refreshLocationを実行
      act(() => {
        result.current.refreshLocation();
      });

      await waitFor(() => {
        expect(result.current.location).toEqual({
          lat: 34.6800,
          lng: 135.8350,
        });
      });
    });
  });

  describe('異常系: エラーハンドリング', () => {
    it('PERMISSION_DENIED エラーを正しく処理する', async () => {
      const error = {
        code: 1,
        message: 'User denied Geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error_callback: PositionErrorCallback) => {
          setTimeout(() => error_callback(error), 10);
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: false })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.location).toBe(null);
    });

    it('TIMEOUT エラーを正しく処理する', async () => {
      const error = {
        code: 3,
        message: 'Timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error_callback: PositionErrorCallback) => {
          setTimeout(() => error_callback(error), 10);
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: false, timeout: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('位置情報の精度とフィルタリング', () => {
    it('精度の低い位置情報（100m以上の誤差）を無視する', async () => {
      const highAccuracyPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      const lowAccuracyPosition = {
        coords: {
          latitude: 34.6800,
          longitude: 135.8350,
          accuracy: 150, // 150mの誤差 - これは無視されるべき
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now() + 6000,
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => success(highAccuracyPosition), 10);
        }
      );

      let watchCallback: PositionCallback | null = null;
      mockGeolocation.watchPosition.mockImplementation(
        (success: PositionCallback) => {
          watchCallback = success;
          return 1;
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });

      // 低精度の位置情報を送信
      if (watchCallback) {
        act(() => {
          watchCallback(lowAccuracyPosition);
        });
      }

      // 位置情報は更新されないことを確認
      expect(result.current.location).toEqual({
        lat: 34.6775,
        lng: 135.8328,
      });
      expect(result.current.accuracy).toBe(20); // 前の精度のまま
    });

    it('距離のしきい値未満の移動は無視する', async () => {
      const position1 = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      // わずか5m移動（しきい値10m未満）
      const position2 = {
        coords: {
          latitude: 34.67755,
          longitude: 135.83285,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now() + 6000,
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success(position1);
        }
      );

      let watchCallback: PositionCallback | null = null;
      mockGeolocation.watchPosition.mockImplementation(
        (success: PositionCallback) => {
          watchCallback = success;
          return 1;
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: true, distanceThreshold: 10 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialLocation = result.current.location;

      // わずかな移動を送信
      if (watchCallback) {
        act(() => {
          watchCallback(position2);
        });
      }

      // 位置情報は更新されないことを確認
      expect(result.current.location).toEqual(initialLocation);
    });

    it('より精度の良い位置情報が取得された場合は更新する', async () => {
      const initialPosition = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 50, // 中程度の精度
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      const betterPosition = {
        coords: {
          latitude: 34.6776,
          longitude: 135.8329,
          accuracy: 15, // より良い精度 (50 * 0.8 = 40より小さい)
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now() + 6000,
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          setTimeout(() => success(initialPosition), 10);
        }
      );

      let watchCallback: PositionCallback | null = null;
      mockGeolocation.watchPosition.mockImplementation(
        (success: PositionCallback) => {
          watchCallback = success;
          return 1;
        }
      );

      const { result } = renderHook(() =>
        useGeolocation({ watchPosition: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.accuracy).toBe(50);

      // より精度の良い位置情報を送信
      if (watchCallback) {
        act(() => {
          watchCallback(betterPosition);
        });
      }

      // より精度の良い位置情報に更新されることを確認
      await waitFor(() => {
        expect(result.current.accuracy).toBe(15);
      });

      expect(result.current.location).toEqual({
        lat: 34.6776,
        lng: 135.8329,
      });
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にwatchPositionをクリアする', async () => {
      const position = {
        coords: {
          latitude: 34.6775,
          longitude: 135.8328,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition;

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => {
          success(position);
        }
      );

      mockGeolocation.watchPosition.mockReturnValue(1);

      const { unmount } = renderHook(() =>
        useGeolocation({ watchPosition: true })
      );

      await waitFor(() => {
        expect(mockGeolocation.watchPosition).toHaveBeenCalled();
      });

      // コンポーネントをアンマウント
      unmount();

      // clearWatchが呼ばれたことを確認
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(1);
    });
  });
});
