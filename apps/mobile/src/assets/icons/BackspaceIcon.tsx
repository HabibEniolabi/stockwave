import * as React from 'react';
import Svg, {
  Path,
  SvgProps,
} from 'react-native-svg';

interface BackspaceIconProps
  extends SvgProps {
  size?: number;
  color?: string;
}

export default function BackspaceIcon({
  size = 28,
  color = '#808897',
  ...props
}: BackspaceIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        d="M20 5H9.7a2 2 0 0 0-1.5.68L3.6 10.9a1.7 1.7 0 0 0 0 2.2l4.6 5.22A2 2 0 0 0 9.7 19H20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="m12 9 5 6M17 9l-5 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}