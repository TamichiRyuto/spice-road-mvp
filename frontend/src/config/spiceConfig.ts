import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SpaIcon from '@mui/icons-material/Spa';

export interface SpiceMetric {
  key: 'spiciness' | 'stimulation' | 'aroma';
  label: string;
  icon: typeof LocalFireDepartmentIcon;
  className: string;
  description: string;
}

export const SPICE_METRICS: readonly SpiceMetric[] = [
  {
    key: 'spiciness',
    label: '辛さ',
    icon: LocalFireDepartmentIcon,
    className: 'heat',
    description: '香辛料による辛みの強さ'
  },
  {
    key: 'stimulation',
    label: '刺激',
    icon: FlashOnIcon,
    className: 'stimulation',
    description: 'スパイスによる舌への刺激'
  },
  {
    key: 'aroma',
    label: '香り',
    icon: SpaIcon,
    className: 'aroma',
    description: 'スパイスの香りの豊かさ'
  }
] as const;

export const SPICE_VALUE_RANGE = {
  min: 0,
  max: 100,
  default: 50
} as const;
