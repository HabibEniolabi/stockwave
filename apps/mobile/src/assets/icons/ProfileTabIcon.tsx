import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath } from 'react-native-svg';

interface ProfileTabIconProps extends SvgProps {
  size?: number;
  color?: string;
  primaryColor?: string;
}
const ProfileTabIcon = ({
  size = 24,
  color = '#718096',
  primaryColor = '#fff',
  ...props
}: ProfileTabIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <G
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      clipPath="url(#a)"
    >
      <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill={primaryColor} d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default ProfileTabIcon;
