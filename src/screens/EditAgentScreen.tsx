import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useAgents } from '../contexts/AgentsContext';
import { isLocalImageUri } from '../lib/agentAvatarsApi';
import AgentAvatar from '../components/AgentAvatar';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditAgent'>;
  route: RouteProp<RootStackParamList, 'EditAgent'>;
};

export default function EditAgentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { agentId } = route.params;
  const { getAgent, updateAgentDetails, removeAgent } = useAgents();
  const agent = getAgent(agentId);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setRole(agent.role);
    setBio(agent.bio);
    setAvatarUri(agent.avatarUrl);
    setRemovePhoto(false);
  }, [agent]);

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const previewAgent = {
    ...agent,
    name: name.trim() || agent.name,
    avatarUrl: removePhoto ? null : (avatarUri && !isLocalImageUri(avatarUri) ? avatarUri : agent.avatarUrl),
  };

  const localPreviewUri = !removePhoto && avatarUri && isLocalImageUri(avatarUri) ? avatarUri : null;

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos access needed', 'Allow photo library access to set an agent image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Agent name is required.');
      return;
    }
    setError(null);
    setLoading(true);

    const pickedNewPhoto = !!avatarUri && isLocalImageUri(avatarUri);
    const result = await updateAgentDetails(agentId, {
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      localAvatarUri: removePhoto ? null : pickedNewPhoto ? avatarUri : undefined,
      removeAvatar: removePhoto,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${agent.name}?`,
      'This removes the agent and their tasks will be unassigned. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await removeAgent(agentId);
            setLoading(false);
            if (result.error) {
              Alert.alert('Could not delete', result.error);
              return;
            }
            navigation.popToTop();
          },
        },
      ]
    );
  };

  const inputStyle = {
    backgroundColor: C.c2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    color: C.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Edit agent</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.85}>
            {localPreviewUri ? (
              <View style={{ width: 96, height: 96, borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: C.border }}>
                <Image source={{ uri: localPreviewUri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              </View>
            ) : (
              <AgentAvatar agent={previewAgent} size={96} statusVariant="pulse" />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickPhoto} style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Change photo</Text>
          </TouchableOpacity>
          {(localPreviewUri || previewAgent.avatarUrl || agent.avatarUrl) && !removePhoto && (
            <TouchableOpacity onPress={() => { setRemovePhoto(true); setAvatarUri(null); }} style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim }}>Remove photo</Text>
            </TouchableOpacity>
          )}
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 10, textAlign: 'center', lineHeight: 17 }}>
            Optional — pick any image from your library. Without a photo, agents use their emblem avatar.
          </Text>
        </View>

        <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Maya" placeholderTextColor={C.textMuted} style={{ ...inputStyle, marginBottom: 16 }} />

        <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Role</Text>
        <TextInput value={role} onChangeText={setRole} placeholder="Research analyst" placeholderTextColor={C.textMuted} style={{ ...inputStyle, marginBottom: 16 }} />

        <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="What this agent does for you"
          placeholderTextColor={C.textMuted}
          multiline
          style={{ ...inputStyle, minHeight: 96, textAlignVertical: 'top', marginBottom: 16 }}
        />

        {error && (
          <View style={{ marginBottom: 16, padding: 12, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171' }}>{error}</Text>
          </View>
        )}

        <PrimaryButton onPress={handleSave} disabled={loading} style={{ marginBottom: 12 }}>
          {loading ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
        <SecondaryButton onPress={() => navigation.goBack()} disabled={loading}>Cancel</SecondaryButton>

        <TouchableOpacity onPress={handleDelete} disabled={loading} style={{ marginTop: 32, padding: 16, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: '#f87171' }}>Delete agent</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.a} size="large" />
        </View>
      )}
    </View>
  );
}
