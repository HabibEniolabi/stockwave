// import * as React from 'react';
// import Svg, { SvgProps, G, Path, Defs, ClipPath } from 'react-native-svg';

// interface PortfolioTabIconProps extends SvgProps {
//   size?: number;
//   color?: string;
//   primaryColor?: string;
// }
// const PortfolioTabIcon = ({
//   size = 24,
//   color = '#718096',
//   primaryColor = 'fff',
//   ...props
// }: PortfolioTabIconProps) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
//     <G
//       stroke={color}
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={1.5}
//       clipPath="url(#a)"
//     >
//       <Path d="M10 3.2A9 9 0 1 0 20.8 14a1 1 0 0 0-1-1H13a2 2 0 0 1-2-2V4a.902.902 0 0 0-1-.8Z" />
//       <Path d="M15 3.5A9 9 0 0 1 20.5 9H16a1 1 0 0 1-1-1V3.5Z" />
//     </G>
//     <Defs>
//       <ClipPath id="a">
//         <Path fill={primaryColor} d="M0 0h24v24H0z" />
//       </ClipPath>
//     </Defs>
//   </Svg>
// );
// export default PortfolioTabIcon;


import * as React from 'react';
import Svg, {
  SvgProps,
  G,
  Path,
  Defs,
  ClipPath,
} from 'react-native-svg';

interface PortfolioTabIconProps extends SvgProps {
  size?: number;
  color?: string;
  primaryColor?: string;
  focused?: boolean;
}

const PortfolioTabIcon = ({
  size = 24,
  color = '#718096',
  primaryColor = '#fff',
  focused = false,
  ...props
}: PortfolioTabIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    {focused ? (
      <>
        <Path
          d="M10 3.2A9 9 0 1 0 20.8 14a1 1 0 0 0-1-1H13a2 2 0 0 1-2-2V4a.902.902 0 0 0-1-.8Z"
          fill={color}
        />

        <Path
          d="M15 3.5A9 9 0 0 1 20.5 9H16a1 1 0 0 1-1-1V3.5Z"
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
          clipPath="url(#portfolioClip)"
        >
          <Path d="M10 3.2A9 9 0 1 0 20.8 14a1 1 0 0 0-1-1H13a2 2 0 0 1-2-2V4a.902.902 0 0 0-1-.8Z" />

          <Path d="M15 3.5A9 9 0 0 1 20.5 9H16a1 1 0 0 1-1-1V3.5Z" />
        </G>

        <Defs>
          <ClipPath id="portfolioClip">
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

export default PortfolioTabIcon;