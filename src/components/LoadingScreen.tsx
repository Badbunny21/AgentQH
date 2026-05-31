import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { C, FONTS } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: C.c0, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ActivityIndicator size="large" color={C.a} />
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>{message}</Text>
    </View>
  );
}
