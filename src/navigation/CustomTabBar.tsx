import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import { C, FONTS } from '../constants/theme';

const TABS = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Inbox', icon: 'inbox', label: 'Inbox' },
  { name: 'Tasks', icon: 'target', label: 'Tasks' },
  { name: 'You', icon: 'user', label: 'You' },
];

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingBottom: insets.bottom + 8,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <View
        style={{
          backgroundColor: 'rgba(13,15,21,0.86)',
          borderRadius: 999,
          padding: 6,
          borderWidth: 1,
          borderColor: C.borderStrong,
          flexDirection: 'row',
          gap: 4,
        }}
      >
        {TABS.map((tab, index) => {
          const isActive = state.index === index;
          const route = state.routes[index];
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isActive) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#a3e635', '#22d3ee', '#e879f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 44,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name={tab.icon} size={17} color="#0a0a0a" />
                  <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: '#0a0a0a', letterSpacing: -0.1 }}>
                    {tab.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={{
                flex: 1,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Icon name={tab.icon} size={17} color={C.textDim} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
