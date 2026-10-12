import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface PlatformLogoProps {
  id: string;
  size?: number;
  color?: string;
}

export default function PlatformLogo({ id, size = 28, color = 'rgba(10,10,15,0.85)' }: PlatformLogoProps) {
  switch (id.toLowerCase()) {
    case 'telegram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 11l18-7-3 16-6-3-4 4-1-6 10-7-12 5z" fill={color} />
        </Svg>
      );
    case 'discord':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 6h14l1 14-5-2-1-2-3 2-3-2-1 2-5 2z" fill={color} />
          <Circle cx={9} cy={12} r={1.4} fill="#fff" />
          <Circle cx={15} cy={12} r={1.4} fill="#fff" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={8} fill={color} />
        </Svg>
      );
  }
}
