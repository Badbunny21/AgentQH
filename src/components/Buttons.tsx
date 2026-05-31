import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { C, FONTS } from '../constants/theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  icon?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function PrimaryButton({ children, onPress, icon, style, disabled }: PrimaryButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[{ borderRadius: 999, overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={['#a3e635', '#22d3ee', '#e879f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 52,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 24,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 16,
            color: '#0a0a0a',
            letterSpacing: -0.2,
          }}
        >
          {children}
        </Text>
        {icon && <Icon name={icon} size={18} color="#0a0a0a" strokeWidth={2.2} />}
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SecondaryButton({ children, onPress, style }: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          height: 52,
          borderRadius: 999,
          backgroundColor: C.c2,
          borderWidth: 1,
          borderColor: C.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: FONTS.medium,
          fontSize: 16,
          color: C.text,
          letterSpacing: -0.2,
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface GhostChipProps {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function GhostChip({ children, onPress, active, icon, style }: GhostChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          height: 36,
          borderRadius: 999,
          backgroundColor: active ? C.c3 : 'transparent',
          borderWidth: 1,
          borderColor: active ? C.borderStrong : C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 14,
          gap: 6,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={14} color={C.text} />}
      <Text
        style={{
          fontFamily: FONTS.medium,
          fontSize: 13,
          color: C.text,
          letterSpacing: -0.1,
        }}
        numberOfLines={1}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
