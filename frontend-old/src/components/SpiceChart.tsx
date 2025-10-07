import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SpiceParameters } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SpiceChartProps {
  spiceParameters: SpiceParameters;
  shopName: string;
  size?: 'small' | 'medium' | 'large';
}

const SpiceChart = ({ spiceParameters, shopName, size = 'large' }: SpiceChartProps) => {
  // No conversion needed, use 0-100 scale directly

  const chartHeight = size === 'small' ? '120px' : size === 'medium' ? '160px' : '200px';
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 13;

  const data = {
    labels: ['辛さ', '刺激', '香り'],
    datasets: [
      {
        label: shopName,
        data: [
          spiceParameters.spiciness,
          spiceParameters.stimulation,
          spiceParameters.aroma,
        ],
        backgroundColor: [
          'rgba(210, 105, 30, 0.9)',
          'rgba(205, 133, 63, 0.9)',
          'rgba(139, 69, 19, 0.9)',
        ],
        borderColor: [
          '#d2691e',
          '#cd853f',
          '#8b4513',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#2d1810',
          font: {
            size: fontSize,
            weight: '700'
          },
        },
        grid: {
          color: 'rgba(184, 128, 87, 0.5)',
          lineWidth: 1,
        },
        title: {
          display: true,
          text: '評価値 (0-100)',
          color: '#2d1810',
          font: {
            size: fontSize,
            weight: '700'
          }
        }
      },
      x: {
        ticks: {
          color: '#2d1810',
          font: {
            size: fontSize,
            weight: '700'
          },
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'パラメーター',
          color: '#2d1810',
          font: {
            size: fontSize,
            weight: '700'
          }
        }
      },
    },
  };

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <Bar data={data} options={options as any} />
    </div>
  );
};

export default SpiceChart;