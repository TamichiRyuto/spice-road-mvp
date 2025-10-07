import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Chip,
  Fade
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';
import LocationOffIcon from '@mui/icons-material/LocationOff';

interface LocationIndicatorProps {
  isLoading: boolean;
  hasLocation: boolean;
  error: string | null;
  accuracy?: number | null;
  lastUpdated?: Date | null;
  size?: 'small' | 'medium' | 'large';
}

const LocationIndicator = ({ 
  isLoading, 
  hasLocation, 
  error, 
  accuracy,
  lastUpdated,
  size = 'medium' 
}: LocationIndicatorProps) => {
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: <CircularProgress size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} sx={{ color: '#ff9800' }} />,
        text: '位置情報を取得中...',
        color: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderColor: 'rgba(255, 152, 0, 0.3)'
      };
    }
    
    if (error) {
      return {
        icon: <LocationOffIcon fontSize={size} sx={{ color: '#d32f2f' }} />,
        text: '位置情報取得エラー',
        color: '#d32f2f',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        borderColor: 'rgba(211, 47, 47, 0.3)'
      };
    }
    
    if (hasLocation) {
      return {
        icon: <GpsFixedIcon fontSize={size} sx={{ color: '#4caf50' }} />,
        text: '位置情報取得済み',
        color: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: 'rgba(76, 175, 80, 0.3)'
      };
    }
    
    return {
      icon: <GpsNotFixedIcon fontSize={size} sx={{ color: '#666' }} />,
      text: '位置情報未取得',
      color: '#666',
      backgroundColor: 'rgba(102, 102, 102, 0.1)',
      borderColor: 'rgba(102, 102, 102, 0.3)'
    };
  };

  const statusInfo = getStatusInfo();
  const fontSize = size === 'small' ? '0.75rem' : size === 'medium' ? '0.875rem' : '1rem';
  const chipHeight = size === 'small' ? 24 : size === 'medium' ? 32 : 40;

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.text}
          sx={{
            backgroundColor: statusInfo.backgroundColor,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.borderColor}`,
            fontWeight: 600,
            fontSize: fontSize,
            height: chipHeight,
            '& .MuiChip-icon': {
              color: statusInfo.color,
            },
            '& .MuiChip-label': {
              paddingLeft: 0.5,
              paddingRight: size === 'small' ? 1 : 1.5,
            }
          }}
        />
        
        {/* Detailed info for medium and large sizes */}
        {size !== 'small' && hasLocation && accuracy && (
          <Typography
            variant="caption"
            sx={{
              color: '#666',
              fontSize: '0.75rem',
              opacity: 0.8,
            }}
          >
            精度: ±{Math.round(accuracy)}m
          </Typography>
        )}
        
        {/* Last updated info for large size */}
        {size === 'large' && lastUpdated && (
          <Typography
            variant="caption"
            sx={{
              color: '#666',
              fontSize: '0.75rem',
              opacity: 0.8,
            }}
          >
            更新: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LocationIndicator;