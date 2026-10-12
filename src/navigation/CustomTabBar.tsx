import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONTS } from '../constants/theme';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: insets.bottom + 8 }}>
      <View style={{ backgroundColor: C.c2, borderRadius: 22, borderWidth: 1, borderColor: C.borderStrong, flexDirection: 'row', paddingVertical: 3 }}>
        {state.routes.map((route, index) => {
          const active = state.index === index;
          const { options } = descriptors[route.key];
          return (
            <TouchableOpacity key={route.key} accessibilityRole="tab" accessibilityState={{ selected: active }}
              accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: active ? C.a : C.textMuted, fontFamily: active ? FONTS.semibold : FONTS.regular, fontSize: 13 }}>{route.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
