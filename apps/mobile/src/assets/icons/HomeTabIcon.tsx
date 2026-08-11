import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface HomeTabIconProps extends SvgProps {
  size?: number;
  color?: string;
}
const HomeTabIcon = ({size = 24, color = "#718096", ...props}: HomeTabIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m15.72 5.46-5.333-4.148a2.666 2.666 0 0 0-3.274 0L1.779 5.46A2.665 2.665 0 0 0 .75 7.565v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105Z"
    />
  </Svg>
)
export default HomeTabIcon