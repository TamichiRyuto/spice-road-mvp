import { Box, Typography, Chip } from '@mui/material';
import { SpiceParameters } from '../types';
import { SPICE_METRICS } from '../config/spiceConfig';
import './css/SpiceChart.css';

interface SpiceChartProps {
  spiceParameters: SpiceParameters;
  shopName: string;
  size?: 'small' | 'medium' | 'large';
}

const SpiceChart = ({ spiceParameters, shopName, size = 'large' }: SpiceChartProps) => {
  const spiceData = SPICE_METRICS.map(metric => ({
    ...metric,
    value: spiceParameters[metric.key]
  }));

  const containerPadding = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const itemGap = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;

  return (
    <Box className="spice-chart" sx={{ p: containerPadding / 8 }}>
      <Typography
        className="spice-chart-title"
        variant={size === 'small' ? 'body2' : 'subtitle1'}
        sx={{
          mb: itemGap / 8,
          fontSize: size === 'small' ? '0.875rem' : size === 'medium' ? '1rem' : '1.1rem'
        }}
      >
        スパイス分析
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: itemGap / 8 }}>
        {spiceData.map((item) => {
          const IconComponent = item.icon;
          return (
            <Box
              key={item.label}
              className={`spice-chart-item ${item.className}`}
              sx={{ gap: 1.5, p: 1.5 }}
            >
              <IconComponent
                className={`spice-chart-icon ${item.className}`}
                sx={{ fontSize: iconSize }}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography
                    className="spice-chart-label"
                    variant={size === 'small' ? 'caption' : 'body2'}
                    sx={{
                      fontSize: size === 'small' ? '0.75rem' : size === 'medium' ? '0.875rem' : '1rem'
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Chip
                    label={`${item.value}/100`}
                    size={size === 'small' ? 'small' : 'medium'}
                    sx={{
                      fontWeight: 700,
                      fontSize: size === 'small' ? '0.7rem' : '0.875rem',
                      height: size === 'small' ? 20 : 24,
                    }}
                    color={item.className === 'heat' ? 'error' : item.className === 'stimulation' ? 'warning' : 'success'}
                  />
                </Box>

                <Box
                  className="spice-chart-bar-bg"
                  sx={{
                    height: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
                  }}
                >
                  <Box
                    className={`spice-chart-bar ${item.className}`}
                    sx={{ width: `${item.value}%` }}
                  />
                </Box>

                {size !== 'small' && (
                  <Typography
                    className="spice-chart-description"
                    variant="caption"
                  >
                    {item.description}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SpiceChart;