import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, color = '#f5f5f7', strokeWidth = 1.75 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'bell':
      return (
        <Svg {...props}>
          <Path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M10 21a2 2 0 004 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...props}>
          <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M21 21l-4.3-4.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'chevR':
      return (
        <Svg {...props}>
          <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'chevL':
      return (
        <Svg {...props}>
          <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'chevD':
      return (
        <Svg {...props}>
          <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Path d="M5 12l4 4 10-10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...props}>
          <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'send':
      return (
        <Svg {...props}>
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'msg':
      return (
        <Svg {...props}>
          <Path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'inbox':
      return (
        <Svg {...props}>
          <Path d="M22 12h-6l-2 3h-4l-2-3H2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M5.5 5h13l3.5 7v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M4 21a8 8 0 0116 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...props}>
          <Path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...props}>
          <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...props}>
          <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M2 7l10 6 10-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...props}>
          <Path d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M7 12h10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'sigma':
      return (
        <Svg {...props}>
          <Path d="M6 4h12l-7 8 7 8H6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...props}>
          <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg {...props}>
          <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...props}>
          <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={strokeWidth} fill="none" />
          <Path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'brain':
      return (
        <Svg {...props}>
          <Path d="M9 3a3 3 0 00-3 3 3 3 0 00-3 3v6a3 3 0 003 3 3 3 0 003 3h6a3 3 0 003-3 3 3 0 003-3V9a3 3 0 00-3-3 3 3 0 00-3-3H9z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M9 9v6M15 9v6M9 12h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'download':
      return (
        <Svg {...props}>
          <Path d="M12 3v13M6 11l6 6 6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M5 21h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...props}>
          <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'fire':
      return (
        <Svg {...props}>
          <Path d="M12 2c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 1-5 2 1 3 2 4-5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'folder':
      return (
        <Svg {...props}>
          <Path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'quote':
      return (
        <Svg {...props}>
          <Path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    default:
      return (
        <Svg {...props}>
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="none" />
        </Svg>
      );
  }
}
