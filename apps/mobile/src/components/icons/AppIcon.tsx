import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../theme/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type AppIconName =
  | 'home'
  | 'portfolio'
  | 'transfer'
  | 'market'
  | 'profile'
  | 'notification'
  | 'visibility'
  | 'add'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'search'
  | 'settings'
  | 'close'
  | 'back'
  | 'visibilityOff'
  | 'faceId'
  | 'fingerprint'
  | 'checkmark';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  focused?: boolean;
}

const icons: Record<
  AppIconName,
  {
    default: IoniconName;
    focused?: IoniconName;
  }
> = {
  home: {
    default: 'home-outline',
    focused: 'home',
  },
  portfolio: {
    default: 'pie-chart-outline',
    focused: 'pie-chart',
  },
  transfer: {
    default: 'swap-horizontal-outline',
    focused: 'swap-horizontal',
  },
  market: {
    default: 'trending-up-outline',
    focused: 'trending-up',
  },
  profile: {
    default: 'person-outline',
    focused: 'person',
  },
  notification: {
    default: 'notifications-outline',
    focused: 'notifications',
  },
  visibility: {
    default: 'eye-outline',
    focused: 'eye',
  },
  visibilityOff: {
    default: 'eye-off-outline',
    focused: 'eye-off',
  },
  add: {
    default: 'add-circle-outline',
    focused: 'add-circle',
  },
  chevronRight: {
    default: 'chevron-forward',
  },
  chevronDown: {
    default: 'chevron-down',
  },
  chevronLeft: {
    default: 'chevron-back',
  },
  search: {
    default: 'search-outline',
  },
  settings: {
    default: 'settings-outline',
  },
  close: {
    default: 'close',
  },
  back: {
    default: 'chevron-back',
  },
  fingerprint: {
    default: 'finger-print-outline',
    focused: 'finger-print'
  },
  faceId: {
    default: 'finger-print-outline',
    focused: 'finger-print'
  },
  checkmark: {
    default: 'checkmark-circle-outline',
    focused: 'checkmark-circle'
  }
};

export function AppIcon({
  name,
  size = 24,
  color = colors.neutral[600],
  focused = false,
}: AppIconProps) {
  const icon = icons[name];

  return (
    <Ionicons
      name={focused && icon.focused ? icon.focused : icon.default}
      size={size}
      color={color}
    />
  );
}