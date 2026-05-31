import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
import { PrimaryButton } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfileName } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    const result = await updateProfileName(name);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Edit profile</Text>
      </View>

      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Display name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={C.textMuted}
          autoCapitalize="words"
          style={{ backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, color: C.text, fontFamily: FONTS.regular, fontSize: 16, marginBottom: 8 }}
        />
        <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginBottom: 24 }}>{profile?.email}</Text>

        {error && (
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</Text>
        )}

        <PrimaryButton onPress={handleSave} disabled={loading || !name.trim()}>
          {loading ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
        {loading && <ActivityIndicator color={C.a} style={{ marginTop: 16 }} />}
      </View>
    </View>
  );
}
