import React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// Фирменный знак mesto — пин-пузырь с «m».
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="mestoG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6c5ce7" />
          <Stop offset="1" stopColor="#a855f7" />
        </LinearGradient>
      </Defs>
      <Path
        d="M256 48 C154 48 72 130 72 232 C72 340 180 408 244 476 Q256 490 268 476 C332 408 440 340 440 232 C440 130 358 48 256 48 Z"
        fill="url(#mestoG)"
      />
      <SvgText
        x="256"
        y="300"
        fontSize="200"
        fontWeight="bold"
        fill="#fff"
        textAnchor="middle"
      >
        m
      </SvgText>
    </Svg>
  );
}
