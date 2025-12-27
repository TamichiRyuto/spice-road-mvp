// スパイスロードNara Service Worker
// パフォーマンス最適化とオフライン対応

const CACHE_NAME = 'spice-road-nara-v1.0.0';
const RUNTIME_CACHE_NAME = 'spice-road-nara-runtime-v1.0.0';

// キャッシュする静的リソース
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap'
];

// インストール時の処理
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        // アクティベーションを待たずに新しいSWを有効化
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// アクティベート時の処理（古いキャッシュの削除）
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation completed');
      // すべてのクライアントを即座に制御
      return self.clients.claim();
    })
  );
});

// フェッチイベントの処理（リクエストインターセプト）
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // GET リクエストのみ処理
  if (request.method !== 'GET') {
    return;
  }

  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Google Maps APIの処理
  if (url.hostname.includes('maps.googleapis.com') || url.hostname.includes('maps.gstatic.com')) {
    event.respondWith(handleMapApiRequest(request));
    return;
  }

  // 静的リソースの処理
  if (STATIC_RESOURCES.some(resource => request.url.includes(resource.replace('/', '')))) {
    event.respondWith(handleStaticResourceRequest(request));
    return;
  }

  // その他のリクエスト（HTML、CSS、JSなど）
  event.respondWith(handleGeneralRequest(request));
});

// APIリクエストの処理（Network First戦略）
async function handleApiRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  
  try {
    // ネットワークから最新データを取得
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 成功したレスポンスをキャッシュ
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network request failed, trying cache:', request.url);
    
    // ネットワークが失敗した場合、キャッシュから返す
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュもない場合は、オフライン用の応答を返す
    return new Response(
      JSON.stringify({
        error: 'ネットワークエラー',
        message: 'インターネット接続を確認してください',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Google Maps APIの処理（Network First戦略）
async function handleMapApiRequest(request) {
  try {
    // Google Maps APIは常に最新を取得（APIキーとセッション管理のため）
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Google Maps APIが取得できない場合のフォールバック
    console.error('Service Worker: Google Maps API request failed:', error);
    return new Response('', { status: 503 });
  }
}

// 静的リソースの処理（Cache First戦略）
async function handleStaticResourceRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static resource:', request.url);
    throw error;
  }
}

// 一般的なリクエストの処理（Stale While Revalidate戦略）
async function handleGeneralRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  
  // キャッシュから即座にレスポンス
  const cachedResponse = await cache.match(request);
  
  // バックグラウンドで更新
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // ネットワークエラーは無視
  });
  
  // キャッシュがあればそれを返し、なければネットワークを待つ
  return cachedResponse || networkResponsePromise;
}

// バックグラウンド同期（位置情報の更新など）
self.addEventListener('sync', event => {
  if (event.tag === 'background-location-sync') {
    event.waitUntil(handleBackgroundLocationSync());
  }
});

async function handleBackgroundLocationSync() {
  try {
    // バックグラウンドでの位置情報更新処理
    console.log('Service Worker: Background location sync');
    
    // クライアントに位置情報更新を通知
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_LOCATION_UPDATE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// プッシュ通知の処理
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || '新しい情報があります',
      icon: '/logo192.png',
      badge: '/favicon.ico',
      tag: 'spice-road-notification',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: '表示'
        },
        {
          action: 'dismiss',
          title: '閉じる'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'スパイスロードNara',
        options
      )
    );
  } catch (error) {
    console.error('Service Worker: Push notification error:', error);
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// エラーハンドリング
self.addEventListener('error', event => {
  console.error('Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
  event.preventDefault();
});