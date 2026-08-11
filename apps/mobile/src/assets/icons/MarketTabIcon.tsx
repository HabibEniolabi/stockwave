import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface MarketTabIconProps extends SvgProps {
  size?: number;
  color?: string;
}
const MarketTabIcon = ({size = 24, color = "#718096", ...props}: MarketTabIconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      fill={color}
      d="M13.748 5.5h7.554l.1.014.1.028.06.026c.079.034.153.085.218.15l.04.044.044.057.054.09.04.09.018.064.014.064.01.095v7.532a.75.75 0 0 1-1.493.102l-.007-.102V8.059l-7.72 7.72a.75.75 0 0 1-.976.073l-.084-.073-2.97-2.97-5.47 5.47a.75.75 0 0 1-1.134-.977l.073-.084 6-6a.75.75 0 0 1 .976-.073l.085.073 2.97 2.97L19.437 7h-5.689a.75.75 0 0 1-.743-.648l-.007-.102a.75.75 0 0 1 .648-.743l.102-.007Z"
    />
  </Svg>
)
export default MarketTabIcon
