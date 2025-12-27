import { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Chip, 
  Typography, 
  Collapse, 
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import { CurryShop, PublicUser } from '../types';

interface FilterBarProps {
  shops: CurryShop[];
  users?: PublicUser[];
  onFilterChange: (filteredShops: CurryShop[]) => void;
  className?: string;
  searchQuery?: string;
}

interface FilterState {
  regions: string[];
  similarUsers: string[]; // User IDs for similar preference filtering
}

interface FilterCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const FilterBar = ({ shops, users = [], onFilterChange, className = '', searchQuery = '' }: FilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    regions: [],
    similarUsers: []
  });

  // Define filter categories for extensibility
  const filterCategories: FilterCategory[] = [
    {
      id: 'regions',
      title: '地域フィルター',
      icon: LocationOnIcon,
      description: '特定の地域の店舗に絞り込み'
    },
    {
      id: 'similarUsers',
      title: '似た好みのユーザー',
      icon: PeopleIcon,
      description: '似た好みを持つユーザーが気に入った店舗'
    }
  ];

  // Extract unique regions from shops
  const availableRegions = Array.from(
    new Set(Array.isArray(shops) ? shops.map(shop => shop.region).filter(Boolean) : [])
  ).sort();

  // Extract available users for similar preference filtering
  const availableUsers = users.filter(user => user.id && user.displayName);

  // Apply filters to shops
  const applyFilters = useCallback((filters: FilterState) => {
    let filtered = Array.isArray(shops) ? [...shops] : [];

    // Search query filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query) ||
        (shop.description && shop.description.toLowerCase().includes(query)) ||
        (shop.region && shop.region.toLowerCase().includes(query))
      );
    }

    // Region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(shop =>
        shop.region && filters.regions.includes(shop.region)
      );
    }

    // Similar users filter (placeholder implementation)
    if (filters.similarUsers.length > 0) {
      // TODO: Implement user preference-based filtering
      // 1. Get the selected users' favorite shops
      // 2. Calculate similarity scores based on spice preferences
      // 3. Filter shops based on similarity criteria
    }

    return filtered;
  }, [shops, searchQuery]);

  // Update filtered shops when filters or search query change
  useEffect(() => {
    const filteredShops = applyFilters(activeFilters);
    onFilterChange(filteredShops);
  }, [activeFilters, applyFilters, onFilterChange, searchQuery]);

  const handleRegionToggle = (region: string) => {
    setActiveFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region]
    }));
  };

  const handleUserToggle = (userId: string) => {
    setActiveFilters(prev => ({
      ...prev,
      similarUsers: prev.similarUsers.includes(userId)
        ? prev.similarUsers.filter(id => id !== userId)
        : [...prev.similarUsers, userId]
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      regions: [],
      similarUsers: []
    });
  };

  const hasActiveFilters = activeFilters.regions.length > 0 || activeFilters.similarUsers.length > 0;
  const activeFilterCount = activeFilters.regions.length + activeFilters.similarUsers.length;

  return (
    <Box className={className}>
      {/* Filter Toggle Button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: showFilters ? 2 : 0 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={showFilters ? 'フィルターを閉じる' : 'フィルターを開く'}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                backgroundColor: showFilters ? 'rgba(139, 69, 19, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(139, 69, 19, 0.2)',
                },
              }}
            >
              <FilterListIcon sx={{ color: '#8b4513' }} />
            </IconButton>
          </Tooltip>
          
          <Typography
            variant="subtitle2"
            sx={{
              color: '#8b4513',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            フィルター
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                sx={{
                  ml: 1,
                  height: 18,
                  fontSize: '0.75rem',
                  backgroundColor: '#d2691e',
                  color: 'white'
                }}
              />
            )}
          </Typography>
        </Box>

        {hasActiveFilters && (
          <Tooltip title="すべてのフィルターをクリア">
            <IconButton
              size="small"
              onClick={clearAllFilters}
              sx={{
                color: '#666',
                '&:hover': {
                  color: '#d32f2f',
                },
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Filter Content */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 248, 237, 0.8)',
            border: '1px solid rgba(139, 69, 19, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Dynamic Filter Categories */}
          {filterCategories.map((category, index) => {
            const IconComponent = category.icon;
            const isRegionFilter = category.id === 'regions';
            const isUserFilter = category.id === 'similarUsers';
            
            // Skip user filter if no users available
            if (isUserFilter && availableUsers.length === 0) {
              return null;
            }
            
            const items = isRegionFilter 
              ? availableRegions.map(region => ({ id: region, label: region }))
              : isUserFilter 
              ? availableUsers.map(user => ({ id: user.id!, label: user.displayName }))
              : [];
            
            const activeItems = isRegionFilter 
              ? activeFilters.regions 
              : isUserFilter 
              ? activeFilters.similarUsers 
              : [];
            
            const handleToggle = isRegionFilter 
              ? handleRegionToggle 
              : isUserFilter 
              ? handleUserToggle 
              : () => {};

            return (
              <Box key={category.id} sx={{ mb: index < filterCategories.length - 1 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <IconComponent sx={{ color: '#8b4513', fontSize: 20 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#8b4513',
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    {category.title}
                  </Typography>
                </Box>
                
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666',
                    fontSize: '0.75rem',
                    display: 'block',
                    mb: 1
                  }}
                >
                  {category.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {items.map(item => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      clickable
                      onClick={() => handleToggle(item.id!)}
                      variant={activeItems.includes(item.id!) ? 'filled' : 'outlined'}
                      sx={{
                        backgroundColor: activeItems.includes(item.id!) 
                          ? '#d2691e' 
                          : 'transparent',
                        color: activeItems.includes(item.id!) 
                          ? 'white' 
                          : '#8b4513',
                        borderColor: '#d2691e',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&:hover': {
                          backgroundColor: activeItems.includes(item.id!)
                            ? '#b8571c'
                            : 'rgba(210, 105, 30, 0.1)',
                        },
                        '&.MuiChip-filled': {
                          '&:hover': {
                            backgroundColor: '#b8571c',
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
                
                {index < filterCategories.length - 1 && items.length > 0 && (
                  <Divider sx={{ mt: 2, backgroundColor: 'rgba(139, 69, 19, 0.2)' }} />
                )}
              </Box>
            );
          })}

          {/* Filter Summary */}
          {hasActiveFilters && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(139, 69, 19, 0.2)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}
              >
                {applyFilters(activeFilters).length}件の店舗が表示されています
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterBar;