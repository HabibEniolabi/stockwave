// import * as React from 'react';
// import Svg, { SvgProps, G, Path, Defs, ClipPath } from 'react-native-svg';

// interface ProfileTabIconProps extends SvgProps {
//   size?: number;
//   color?: string;
//   primaryColor?: string;
//   focused?: boolean,
// }
// const ProfileTabIcon = ({
//   size = 24,
//   color = '#718096',
//   primaryColor = '#fff',
//   focused = false,
//   ...props
// }: ProfileTabIconProps) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
//     <G
//       stroke={color}
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={1.5}
//       clipPath="url(#a)"
//     >
//       <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
//     </G>
//     <Defs>
//       <ClipPath id="a">
//         <Path fill={primaryColor} d="M0 0h24v24H0z" />
//       </ClipPath>
//     </Defs>
//   </Svg>
// );
// export default ProfileTabIcon;

import * as React from 'react';
import Svg, {
  SvgProps,
  G,
  Path,
  Defs,
  ClipPath,
  Circle,
} from 'react-native-svg';

interface ProfileTabIconProps extends SvgProps {
  size?: number;
  color?: string;
  primaryColor?: string;
  focused?: boolean;
}

const ProfileTabIcon = ({
  size = 24,
  color = '#718096',
  primaryColor = '#fff',
  focused = false,
  ...props
}: ProfileTabIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    {focused ? (
      <>
        <Circle
          cx="12"
          cy="7"
          r="4"
          fill={color}
        />

        <Path
          d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2H6Z"
          fill={color}
        />
      </>
    ) : (
      <>
        <G
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          clipPath="url(#profileClip)"
        >
          <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />

          <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </G>

        <Defs>
          <ClipPath id="profileClip">
            <Path
              fill={primaryColor}
              d="M0 0h24v24H0z"
            />
          </ClipPath>
        </Defs>
      </>
    )}
  </Svg>
);

export default ProfileTabIcon;