import { Card, CardContent, CardActionArea, Typography, Box, Chip, useTheme } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { CurryShop } from '../types';
import SpiceChart from './SpiceChart';

interface ShopCardProps {
  shop: CurryShop;
  onClick: () => void;
  isSelected: boolean;
}

const ShopCard = ({ shop, onClick, isSelected }: ShopCardProps) => {
  const theme = useTheme();

  return (
    <Card
      elevation={isSelected ? 4 : 1}
      sx={{
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
        '&:hover': {
          elevation: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        aria-pressed={isSelected}
        aria-describedby={`shop-${shop.id}-details`}
        sx={{ height: '100%' }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                {shop.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {shop.address}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mb: 1.5,
                }}
              >
                <Chip
                  icon={<StarIcon sx={{ fontSize: 16 }} />}
                  label={shop.rating}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 700,
                    '& .MuiChip-icon': {
                      color: theme.palette.primary.contrastText,
                    },
                  }}
                />
                {shop.matchScore && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.success.main,
                      fontWeight: 600,
                    }}
                  >
                    マッチ度: {shop.matchScore}%
                  </Typography>
                )}
              </Box>

              {shop.description && (
                <Typography
                  id={`shop-${shop.id}-details`}
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5,
                  }}
                >
                  {shop.description}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="スパイスパラメーターチャート"
            >
              <SpiceChart
                spiceParameters={shop.spiceParameters}
                shopName={shop.name}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ShopCard;