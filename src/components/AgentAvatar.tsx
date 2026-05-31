import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Agent } from '../constants/agents';
import { STATUS_COLORS } from '../constants/theme';

const GRAD_KEYS: Record<string, [string, string]> = {
  aa: ['#a3e635', '#a3e635'],
  bb: ['#22d3ee', '#22d3ee'],
  cc: ['#e879f9', '#e879f9'],
  ab: ['#a3e635', '#22d3ee'],
  bc: ['#22d3ee', '#e879f9'],
  ca: ['#e879f9', '#a3e635'],
};

interface EmblemProps {
  name: string;
  size: number;
  color: string;
}

function Emblem({ name, size, color }: EmblemProps) {
  const s = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {name === 'triStack' && (
        <>
          <Path d="M50 22 L70 56 L30 56 Z" fill="none" stroke={s} strokeWidth="3.5" />
          <Path d="M50 44 L78 78 L22 78 Z" fill={s} />
        </>
      )}
      {name === 'hexMesh' && (
        <>
          <Path d="M50 18 L78 34 L78 66 L50 82 L22 66 L22 34 Z" fill="none" stroke={s} strokeWidth="3.5" />
          <Path d="M50 18 L50 50 L78 66 M50 50 L22 66 M50 50 L50 82" stroke={s} strokeWidth="3.5" fill="none" />
        </>
      )}
      {name === 'spark' && (
        <>
          <Path d="M50 18 L56 44 L82 50 L56 56 L50 82 L44 56 L18 50 L44 44 Z" fill={s} />
          <Circle cx="76" cy="24" r="4" fill={s} />
          <Circle cx="24" cy="76" r="3" fill={s} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x="22" y="22" width="24" height="24" fill={s} />
          <Rect x="54" y="22" width="24" height="24" fill="none" stroke={s} strokeWidth="3.5" />
          <Rect x="22" y="54" width="24" height="24" fill="none" stroke={s} strokeWidth="3.5" />
          <Rect x="54" y="54" width="24" height="24" fill={s} />
        </>
      )}
      {name === 'rings' && (
        <>
          <Circle cx="50" cy="50" r="30" fill="none" stroke={s} strokeWidth="3.5" />
          <Circle cx="50" cy="50" r="18" fill="none" stroke={s} strokeWidth="3.5" />
          <Circle cx="50" cy="50" r="7" fill={s} />
        </>
      )}
      {name === 'crescent' && (
        <>
          <Path d="M68 24 a32 32 0 1 0 0 52 a24 24 0 1 1 0 -52 Z" fill={s} />
          <Circle cx="72" cy="36" r="4" fill={s} />
        </>
      )}
      {name === 'diamond' && (
        <>
          <Path d="M50 16 L82 50 L50 84 L18 50 Z" fill="none" stroke={s} strokeWidth="3.5" />
          <Path d="M50 32 L66 50 L50 68 L34 50 Z" fill={s} />
        </>
      )}
      {name === 'arrow' && (
        <Path d="M22 50 L78 50 M58 30 L78 50 L58 70" stroke={s} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === 'wave' && (
        <>
          <Path d="M14 50 Q28 28 42 50 T70 50 T86 50" stroke={s} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M14 64 Q28 42 42 64 T70 64 T86 64" stroke={s} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {name === 'quote' && (
        <>
          <Path d="M24 32 L40 32 L40 56 L24 70 Z" fill={s} />
          <Path d="M52 32 L68 32 L68 56 L52 70 Z" fill={s} />
        </>
      )}
      {name === 'shield' && (
        <>
          <Path d="M50 18 L78 28 L78 52 Q78 72 50 84 Q22 72 22 52 L22 28 Z" fill="none" stroke={s} strokeWidth="3.5" />
          <Path d="M38 50 L46 58 L62 42" stroke={s} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}

interface StatusDotProps {
  status: string;
  size: number;
  variant?: 'dot' | 'ring' | 'pulse';
}

function StatusDot({ status, size, variant = 'ring' }: StatusDotProps) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.offline;
  const pulseAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (variant === 'pulse' && status === 'online') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.25, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [variant, status]);

  if (variant === 'pulse') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: color,
            opacity: pulseAnim,
          }}
        />
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: variant === 'ring' ? 2 : 0,
        borderColor: '#0d0f15',
      }}
    />
  );
}

interface AgentAvatarProps {
  agent: Agent;
  size?: number;
  variant?: 'emblem' | 'monogram' | 'mono';
  showStatus?: boolean;
  statusVariant?: 'dot' | 'ring' | 'pulse';
}

export default function AgentAvatar({
  agent,
  size = 56,
  variant = 'emblem',
  showStatus = true,
  statusVariant = 'ring',
}: AgentAvatarProps) {
  const [gradFrom, gradTo] = GRAD_KEYS[agent.gradKey] || GRAD_KEYS.ab;
  const borderRadius = size * 0.32;
  const emblSize = size * 0.62;
  const dotSize = size >= 80 ? 16 : size < 56 ? 9 : 12;
  const imageUri = agent.avatarUrl;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  const showPhoto = !!imageUri && !imageFailed;

  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <LinearGradient
        colors={[gradFrom, gradTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {showPhoto ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : variant === 'emblem' ? (
          <Emblem name={agent.emblem} size={emblSize} color="rgba(10,10,15,0.78)" />
        ) : variant === 'monogram' ? (
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: size * 0.42,
              color: 'rgba(10,10,15,0.85)',
              letterSpacing: -1,
            }}
          >
            {agent.name[0]}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: size * 0.28,
              color: 'rgba(10,10,15,0.85)',
              letterSpacing: -0.5,
            }}
          >
            {agent.id.slice(0, 3).toUpperCase()}
          </Text>
        )}
      </LinearGradient>
      {showStatus && (
        <View style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <StatusDot status={agent.status} size={dotSize} variant={statusVariant} />
        </View>
      )}
    </View>
  );
}
