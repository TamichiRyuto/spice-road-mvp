import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import LeafletMap from './components/LeafletMap';
import ShopCard from './components/ShopCard';
import UserRegistrationForm from './components/UserRegistrationForm';
import SearchBar from './components/SearchBar';
import UserProfileCard from './components/UserProfileCard';
import useGeolocation from './hooks/useGeolocation';
import { CurryShop, UserRegistration, PublicUser, User } from './types';

function App() {
  const [shops, setShops] = useState<CurryShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<CurryShop | null>(null);
  const [loading, setLoading] = useState(true);
  // Use the custom geolocation hook
  const { location: userLocation, refreshLocation, error: locationError, isLoading: locationLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000, // 1分間キャッシュ
    watchPosition: true,
    distanceThreshold: 10, // 10m移動したら更新
    updateInterval: 30000, // 30秒間隔で最大チェック
  });

  const shopListRef = useRef<HTMLDivElement>(null);
  
  // User management state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [showUserProfiles, setShowUserProfiles] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchShops = useCallback(async (search = '', userId = '') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`http://localhost:8000/api/shops?${params}`);
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([
        {
          id: '1',
          name: '菩薩咖喱',
          address: '奈良県奈良市薬師堂町21',
          latitude: 34.6775,
          longitude: 135.8328,
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
          latitude: 34.6755,
          longitude: 135.8312,
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
          latitude: 34.6851,
          longitude: 135.8050,
          spiceParameters: {
            spiciness: 55,
            stimulation: 50,
            aroma: 75
          },
          rating: 4.2,
          description: '近鉄奈良駅から徒歩3分のもちいどのセンター街にある人気のカレー店。ほうれん草やトマトなど野菜たっぷりのヘルシーなカレーが自慢'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    fetchShops();
    fetchUsers();
  }, []);

  const handleShopSelect = (shop: CurryShop) => {
    setSelectedShop(shop);
    
    setTimeout(() => {
      const shopElement = document.getElementById(`shop-${shop.id}`);
      if (shopElement && shopListRef.current) {
        shopElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  };


  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchShops(query.trim(), currentUser?.id);
    } else {
      fetchShops('', currentUser?.id);
    }
  }, [fetchShops, currentUser]);

  const handleUserRegistration = async (userData: UserRegistration) => {
    setRegistrationLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const newUser = await response.json();
      setCurrentUser({ ...userData, id: newUser.id, username: userData.username, email: userData.email, isPublic: true, createdAt: newUser.createdAt });
      setShowUserRegistration(false);
      
      const usersResponse = await fetch('http://localhost:8000/api/users');
      const usersData = await usersResponse.json();
      setUsers(usersData);
      
      fetchShops(searchQuery, newUser.id);
      
      alert('登録が完了しました！あなたの好みに合ったお店が上位に表示されます。');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : '登録に失敗しました。もう一度お試しください。');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleUserSelect = useCallback((user: PublicUser) => {
    setSelectedUser(user);
    fetchShops(searchQuery, user.id);
  }, [fetchShops, searchQuery]);

  const clearUserFilter = useCallback(() => {
    setSelectedUser(null);
    fetchShops(searchQuery, '');
  }, [fetchShops, searchQuery]);

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: 'rgba(255, 248, 237, 0.95)',
          color: '#2d1810',
          fontSize: '18px',
          fontWeight: '600'
        }}
      >
        データを読み込み中...
      </div>
    );
  }

  return (
    <div 
      style={{ 
        padding: 'clamp(16px, 4vw, 24px)', 
        fontFamily: 'Noto Sans JP, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f1ea 50%, #ede4d3 100%)',
        minHeight: '100vh',
        color: '#2d1810'
      }}
    >
      <header 
        style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          borderBottom: '2px solid rgba(184, 128, 87, 0.4)',
          paddingBottom: '24px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 
            style={{ 
              color: '#8b4513', 
              fontSize: 'clamp(24px, 5vw, 36px)', 
              margin: '0', 
              fontWeight: '900',
              lineHeight: '1.1',
              textShadow: '2px 2px 4px rgba(45, 24, 16, 0.3)',
              letterSpacing: '-0.5px',
              flexShrink: 0
            }}
          >
            スパイスロードNara
          </h1>
          
          <div className="app-header-buttons">
            {currentUser ? (
              <>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(210, 105, 30, 0.1)',
                  borderRadius: '12px',
                  border: '2px solid rgba(210, 105, 30, 0.3)',
                  color: '#8b4513',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  ログイン中: {currentUser.displayName}
                </div>
                <button
                  onClick={clearUserFilter}
                  style={{
                    padding: '8px 16px',
                    border: '2px solid rgba(184, 128, 87, 0.6)',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: '#8b4513',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  フィルタクリア
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowUserRegistration(true)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: '#d2691e',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(210, 105, 30, 0.3)'
                }}
              >
                ユーザー登録
              </button>
            )}
            <button
              onClick={() => setShowUserProfiles(!showUserProfiles)}
              style={{
                padding: '8px 16px',
                border: '2px solid rgba(184, 128, 87, 0.6)',
                borderRadius: '12px',
                backgroundColor: showUserProfiles ? 'rgba(184, 128, 87, 0.1)' : 'transparent',
                color: '#8b4513',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {showUserProfiles ? 'プロフィールを閉じる' : 'ユーザープロフィール'}
            </button>
          </div>
        </div>

        <div className="app-description-section">
          <img 
            src="/spice-deer.webp" 
            alt="Spice Your Nara" 
            style={{ 
              width: 'clamp(80px, 15vw, 120px)', 
              height: 'clamp(80px, 15vw, 120px)', 
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(139, 69, 19, 0.3)',
              border: '3px solid rgba(210, 105, 30, 0.4)'
            }} 
          />
          <p className="app-description-text">
            多次元スパイス分析による評価システム
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="店名、住所、特徴で検索..."
            initialValue={searchQuery}
          />
          {(selectedUser || currentUser) && (
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#8b4513',
              fontWeight: '600',
              marginTop: '8px'
            }}>
              {selectedUser ? `${selectedUser.displayName}さんの好みでソート中` : '好みに合わせてソート中'}
              {shops.length > 0 && shops[0].matchScore && (
                <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                  (最高マッチ度: {shops[0].matchScore}%)
                </span>
              )}
            </div>
          )}
        </div>

        {showUserProfiles && (
          <div style={{
            marginTop: '24px',
            maxWidth: '800px',
            margin: '24px auto 0'
          }}>
            <h3 style={{
              color: '#8b4513',
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              ユーザープロフィール
            </h3>
            <div style={{
              display: 'grid',
              gap: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              {users.map(user => (
                <UserProfileCard
                  key={user.id}
                  user={user}
                  onClick={() => handleUserSelect(user)}
                  isSelected={selectedUser?.id === user.id}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <main>
        <div className="main-grid">
          <section>
            <h2 
              style={{ 
                color: '#8b4513', 
                marginBottom: '24px', 
                fontSize: '24px', 
                fontWeight: '800',
                borderLeft: '6px solid #d2691e',
                paddingLeft: '20px',
                background: 'rgba(210, 105, 30, 0.15)',
                padding: '16px 20px',
                borderRadius: '12px'
              }}
            >
              店舗位置マップ
            </h2>
            <div 
              style={{ 
                backgroundColor: 'rgba(255, 248, 237, 0.8)', 
                border: '2px solid rgba(184, 128, 87, 0.4)', 
                borderRadius: '16px', 
                padding: '20px'
              }}
            >
              <LeafletMap 
                shops={shops} 
                onShopSelect={handleShopSelect}
                selectedShop={selectedShop}
                userLocation={userLocation}
                onCenterOnLocation={refreshLocation}
              />
            </div>
          </section>
          
          <section>
            <h2 
              style={{ 
                color: '#8b4513', 
                marginBottom: '24px', 
                fontSize: '24px', 
                fontWeight: '800',
                borderLeft: '6px solid #d2691e',
                paddingLeft: '20px',
                background: 'rgba(210, 105, 30, 0.15)',
                padding: '16px 20px',
                borderRadius: '12px'
              }}
            >
              店舗詳細情報
            </h2>
            <div 
              ref={shopListRef}
              style={{ 
                maxHeight: '600px', 
                overflowY: 'auto', 
                paddingRight: '8px'
              }}
            >
              {shops.map(shop => (
                <div key={shop.id} id={`shop-${shop.id}`}>
                  <ShopCard
                    shop={shop}
                    onClick={() => handleShopSelect(shop)}
                    isSelected={selectedShop?.id === shop.id}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {showUserRegistration && (
        <UserRegistrationForm
          onRegister={handleUserRegistration}
          onCancel={() => setShowUserRegistration(false)}
          isLoading={registrationLoading}
        />
      )}
    </div>
  );
}

export default App;