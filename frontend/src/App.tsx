import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  Paper,
  useTheme,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Restaurant as RestaurantIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  FilterAltOff as FilterAltOffIcon,
} from '@mui/icons-material';
import './App.css';
import LeafletMap from './components/LeafletMap';
import ShopCard from './components/ShopCard';
import UserRegistrationForm from './components/UserRegistrationForm';
import SearchBar from './components/SearchBar';
import UserProfileCard from './components/UserProfileCard';
import FilterBar from './components/FilterBar';
import LocationIndicator from './components/LocationIndicator';
import useGeolocation from './hooks/useGeolocation';
import { CurryShop, UserRegistration, PublicUser, User } from './types';
import { API_ENDPOINTS, GEOLOCATION_CONFIG, UI_CONFIG, FALLBACK_SHOPS } from './config/appConfig';

function App() {
  const theme = useTheme();
  const [shops, setShops] = useState<CurryShop[]>([]);
  const [filteredShops, setFilteredShops] = useState<CurryShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<CurryShop | null>(null);
  const [loading, setLoading] = useState(true);
  // Use the custom geolocation hook
  const {
    location: userLocation,
    refreshLocation,
    isLoading: locationLoading,
    error: locationError,
    accuracy: locationAccuracy,
    lastUpdated: locationLastUpdated
  } = useGeolocation(GEOLOCATION_CONFIG);

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

  const fetchShops = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SHOPS);
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Invalid shops data format:', data);
        throw new Error('Invalid data format');
      }

      setShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([...FALLBACK_SHOPS]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    // Parallel fetch for better performance with HTTP/2
    Promise.all([fetchShops(), fetchUsers()]).catch(err => {
      console.error('Error fetching initial data:', err);
    });
  }, [fetchShops, fetchUsers]);

  // Initialize filtered shops when shops change
  useEffect(() => {
    setFilteredShops(shops);
  }, [shops]);

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
    }, UI_CONFIG.SCROLL_DELAY);
  };


  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((filtered: CurryShop[]) => {
    setFilteredShops(filtered);
  }, []);

  const handleUserRegistration = async (userData: UserRegistration) => {
    setRegistrationLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_REGISTER, {
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

      const usersResponse = await fetch(API_ENDPOINTS.USERS);
      const usersData = await usersResponse.json();
      setUsers(usersData);

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
  }, []);

  const clearUserFilter = useCallback(() => {
    setSelectedUser(null);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h6" color="text.primary">
          データを読み込み中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f1ea 50%, #ede4d3 100%)',
        minHeight: '100vh',
        pb: 4,
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack spacing={2.5}>
            {/* Top Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography
                variant="displaySmall"
                component="h1"
                sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 900,
                  textShadow: '2px 2px 4px rgba(45, 24, 16, 0.2)',
                }}
              >
                スパイスロードNara
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {currentUser ? (
                  <>
                    <Chip
                      label={`ログイン中: ${currentUser.displayName}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<FilterAltOffIcon />}
                      onClick={clearUserFilter}
                      size="small"
                    >
                      フィルタクリア
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setShowUserRegistration(true)}
                    size="medium"
                  >
                    ユーザー登録
                  </Button>
                )}
                <Button
                  variant={showUserProfiles ? 'contained' : 'outlined'}
                  startIcon={<PeopleIcon />}
                  onClick={() => setShowUserProfiles(!showUserProfiles)}
                  size="medium"
                >
                  {showUserProfiles ? '閉じる' : 'ユーザー'}
                </Button>
              </Stack>
            </Box>

            {/* Hero Section */}
            <Stack direction="row" spacing={3} alignItems="center" sx={{ mt: 1 }}>
              <Avatar
                src="/spice-deer.webp"
                alt="Spice Your Nara"
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  height: { xs: 80, sm: 100, md: 120 },
                  border: `3px solid ${theme.palette.primary.main}`,
                  boxShadow: 3,
                }}
              />
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                  }}
                >
                  多次元スパイス分析システム
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  奈良のスパイスカレー店を、辛さ・刺激・香りの3つの軸で科学的に分析。あなた好みの一杯を見つけよう。
                </Typography>
              </Box>
            </Stack>

            {/* Search and Filter */}
            <Box sx={{ mt: 2 }}>
              <SearchBar
                onSearch={handleSearch}
                placeholder="店名、住所、特徴で検索..."
                initialValue={searchQuery}
              />
              <FilterBar
                shops={shops}
                users={users}
                onFilterChange={handleFilterChange}
                className="filter-section"
                searchQuery={searchQuery}
              />
              {(selectedUser || currentUser) && (
                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    mt: 1,
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                  }}
                >
                  {selectedUser ? `${selectedUser.displayName}さんの好みでソート中` : '好みに合わせてソート中'}
                  {filteredShops.length > 0 && filteredShops[0].matchScore && (
                    <Box component="span" sx={{ ml: 1, opacity: 0.8 }}>
                      (最高マッチ度: {filteredShops[0].matchScore}%)
                    </Box>
                  )}
                </Typography>
              )}
            </Box>

            {/* User Profiles */}
            {showUserProfiles && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="h6"
                  align="center"
                  gutterBottom
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 800,
                  }}
                >
                  ユーザープロフィール
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    maxHeight: UI_CONFIG.MAX_PROFILES_HEIGHT,
                    overflowY: 'auto',
                    p: 1,
                  }}
                >
                  {users.map(user => (
                    <UserProfileCard
                      key={user.id}
                      user={user}
                      onClick={() => handleUserSelect(user)}
                      isSelected={selectedUser?.id === user.id}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Main Content */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Map Section */}
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationOnIcon color="primary" sx={{ fontSize: '2rem' }} />
                <Typography variant="h6" component="h2" fontWeight={700}>
                  店舗位置マップ
                </Typography>
              </Stack>
              <LocationIndicator
                isLoading={locationLoading}
                hasLocation={!!userLocation}
                error={locationError}
                accuracy={locationAccuracy}
                lastUpdated={locationLastUpdated}
                size="small"
              />
            </Stack>
            {/* <Box className="map-container"> */}
              <LeafletMap
                shops={filteredShops}
                onShopSelect={handleShopSelect}
                selectedShop={selectedShop}
                userLocation={userLocation}
                onCenterOnLocation={refreshLocation}
              />
            {/* </Box> */}
          </Paper>

          {/* Shops List Section */}
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <RestaurantIcon color="primary" sx={{ fontSize: '2rem' }} />
              <Typography variant="h6" component="h2" fontWeight={700}>
                店舗詳細情報
              </Typography>
            </Stack>
            <Box
              ref={shopListRef}
              className="shops-list"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {filteredShops.map(shop => (
                <Box key={shop.id} id={`shop-${shop.id}`}>
                  <ShopCard
                    shop={shop}
                    onClick={() => handleShopSelect(shop)}
                    isSelected={selectedShop?.id === shop.id}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Container>

      {showUserRegistration && (
        <UserRegistrationForm
          onRegister={handleUserRegistration}
          onCancel={() => setShowUserRegistration(false)}
          isLoading={registrationLoading}
        />
      )}
    </Box>
  );
}

export default App;