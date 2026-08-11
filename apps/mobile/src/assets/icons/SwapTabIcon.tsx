import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"

interface SwapTabIconProps extends SvgProps {
  size?: number;
  color?: string;
}
const SwapTabIcon = ({size = 24, color = "#fff", ...props}: SwapTabIconProps) => (
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
      d="M3.197 14.033h11.348M6.61 17.431l-3.414-3.398 3.414-3.398M16.806 5.76H5.458M13.393 2.361l3.413 3.398-3.414 3.399"
    />
  </Svg>
)
export default SwapTabIcon
