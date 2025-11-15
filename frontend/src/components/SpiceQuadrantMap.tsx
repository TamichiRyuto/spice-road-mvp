import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import { CurryShop } from '../types';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface SpiceQuadrantMapProps {
  shops: CurryShop[];
  onShopSelect: (shop: CurryShop) => void;
  selectedShop: CurryShop | null;
}

const SpiceQuadrantMap: React.FC<SpiceQuadrantMapProps> = ({
  shops,
  onShopSelect,
  selectedShop,
}) => {
  const theme = useTheme();
  const chartRef = useRef<ChartJS<'bubble'>>(null);

  // Generate color based on aroma value (0-100)
  const getColorFromAroma = (aroma: number, isSelected: boolean = false) => {
    // Use a gradient from blue (low aroma) to orange/red (high aroma)
    const hue = 200 - (aroma / 100) * 170; // 200 (blue) to 30 (orange-red)
    const saturation = 70;
    const lightness = isSelected ? 50 : 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const chartData = useMemo(() => {
    const data = shops.map((shop) => ({
      x: shop.spiceParameters.spiciness,
      y: shop.spiceParameters.stimulation,
      r: 6 + (shop.spiceParameters.aroma / 100) * 8, // Radius: 6-14 based on aroma (reduced for better performance)
      shop,
    }));

    return {
      datasets: [
        {
          label: 'スパイスカレー店',
          data,
          backgroundColor: data.map((d) =>
            alpha(
              getColorFromAroma(
                d.shop.spiceParameters.aroma,
                selectedShop?.id === d.shop.id
              ),
              selectedShop?.id === d.shop.id ? 1 : 0.6
            )
          ),
          borderColor: data.map((d) =>
            selectedShop?.id === d.shop.id
              ? theme.palette.primary.main
              : alpha(
                  getColorFromAroma(d.shop.spiceParameters.aroma),
                  0.8
                )
          ),
          borderWidth: (context: any) => {
            const shopData = context.raw as { shop: CurryShop };
            return selectedShop?.id === shopData?.shop?.id ? 4 : 2;
          },
        },
      ],
    };
  }, [shops, selectedShop, theme.palette.primary.main]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300, // Reduce animation time for better performance
      },
      onClick: (_event: any, elements: any[]) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const shop = chartData.datasets[0].data[dataIndex].shop;
          onShopSelect(shop);
        }
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: TooltipItem<'bubble'>) => {
              const data = context.raw as { x: number; y: number; r: number; shop: CurryShop };
              const shop = data.shop;
              return [
                `店名: ${shop.name}`,
                `辛さ: ${shop.spiceParameters.spiciness}`,
                `刺激: ${shop.spiceParameters.stimulation}`,
                `香り: ${shop.spiceParameters.aroma}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '辛さ',
            font: {
              size: 12,
              weight: 'bold' as const,
            },
            color: theme.palette.text.primary,
          },
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: theme.palette.text.secondary,
            font: {
              size: 10,
            },
          },
          grid: {
            color: alpha(theme.palette.divider, 0.3),
            lineWidth: (context: any) => (context.tick.value === 50 ? 2 : 1),
          },
        },
        y: {
          title: {
            display: true,
            text: '刺激',
            font: {
              size: 12,
              weight: 'bold' as const,
            },
            color: theme.palette.text.primary,
          },
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: theme.palette.text.secondary,
            font: {
              size: 10,
            },
          },
          grid: {
            color: alpha(theme.palette.divider, 0.3),
            lineWidth: (context: any) => (context.tick.value === 50 ? 2 : 1),
          },
        },
      },
    }),
    [chartData, onShopSelect, theme]
  );

  // Update chart when selectedShop changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [selectedShop]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 600 }}>
      {/* Legend */}
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          p: 1.5,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>横軸:</strong> 辛さ
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>縦軸:</strong> 刺激
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <strong>サイズ・色:</strong> 香り
          </Typography>
        </Box>
      </Paper>

      {/* Quadrant Labels and Chart */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            position: 'absolute',
            top: '8%',
            left: '20%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            px: 1,
            py: 0.3,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
            刺激的×マイルド
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: '8%',
            right: '20%',
            transform: 'translate(50%, -50%)',
            zIndex: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            px: 1,
            py: 0.3,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
            刺激的×激辛
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: '8%',
            left: '20%',
            transform: 'translate(-50%, 50%)',
            zIndex: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            px: 1,
            py: 0.3,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
            穏やか×マイルド
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: '8%',
            right: '20%',
            transform: 'translate(50%, 50%)',
            zIndex: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            px: 1,
            py: 0.3,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" fontSize="0.7rem">
            穏やか×激辛
          </Typography>
        </Box>

        {/* Chart */}
        <Box sx={{ height: '100%', width: '100%' }}>
          <Bubble ref={chartRef} data={chartData} options={options} />
        </Box>
      </Box>
    </Box>
  );
};

export default SpiceQuadrantMap;
