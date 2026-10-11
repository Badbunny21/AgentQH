import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
import PlatformLogo from '../components/PlatformLogo';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddAgent'>;
};

export default function AddAgentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Add agent</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Connect an existing agent
          </Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ImportTelegram')}
              style={{
                backgroundColor: C.c1,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
              activeOpacity={0.8}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#22d3ee', alignItems: 'center', justifyContent: 'center' }}>
                <PlatformLogo id="telegram" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text }}>Import from Telegram</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ImportDiscord')}
              style={{
                backgroundColor: C.c1,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
              activeOpacity={0.8}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#a3e635', alignItems: 'center', justifyContent: 'center' }}>
                <PlatformLogo id="discord" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text }}>Import from Discord</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
