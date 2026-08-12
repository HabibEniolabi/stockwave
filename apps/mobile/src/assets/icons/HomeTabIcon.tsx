import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath } from 'react-native-svg';

// interface HomeTabIconProps extends SvgProps {
//   size?: number;
//   color?: string;
//   primaryColor?: string;
// }
// const HomeTabIcon = ({
//   size = 24,
//   color = '#718096',
//   primaryColor = '#fff',
//   ...props
// }: HomeTabIconProps) => (
//   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
//     <G
//       stroke={color}
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={1.5}
//       clipPath="url(#a)"
//     >
//       <Path d="m19 8.71-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105Z" />
//       <Path d="M16 15c-2.21 1.333-5.792 1.333-8 0" />
//     </G>
//     <Defs>
//       <ClipPath id="a">
//         <Path fill={primaryColor} d="M0 0h24v24H0z" />
//       </ClipPath>
//     </Defs>
//   </Svg>
// );
// export default HomeTabIcon;


interface HomeTabIconProps extends SvgProps {
  size?: number;
  color?: string;
  primaryColor?: string;
  focused?: boolean;
}

const HomeTabIcon = ({
  size = 24,
  color = '#718096',
  primaryColor = '#fff',
  focused = false,
  ...props
}: HomeTabIconProps) => (
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
          d="m19 8.71-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105Z"
          fill={color}
        />

        <Path
          d="M16 15c-2.21 1.333-5.792 1.333-8 0"
          stroke={primaryColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <G
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          clipPath="url(#homeClip)"
        >
          <Path d="m19 8.71-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105Z" />

          <Path d="M16 15c-2.21 1.333-5.792 1.333-8 0" />
        </G>

        <Defs>
          <ClipPath id="homeClip">
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

export default HomeTabIcon;