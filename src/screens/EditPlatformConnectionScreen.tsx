import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAgents } from '../contexts/AgentsContext';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
import PlatformLogo from '../components/PlatformLogo';
import AgentAvatar from '../components/AgentAvatar';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import {
  disconnectDiscord,
  disconnectTelegram,
  fetchDiscordConnectionStatus,
  fetchTelegramConnectionStatus,
  updateDiscordChannel,
  DiscordConnectionStatus,
  TelegramConnectionStatus,
} from '../lib/platformConnectionsApi';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditPlatformConnection'>;
  route: RouteProp<RootStackParamList, 'EditPlatformConnection'>;
};

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: ok ? 'rgba(163,230,53,0.12)' : 'rgba(248,113,113,0.1)',
        borderWidth: 1,
        borderColor: ok ? 'rgba(163,230,53,0.35)' : 'rgba(248,113,113,0.35)',
      }}
    >
      <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: ok ? C.a : '#f87171', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

export default function EditPlatformConnectionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { agentId } = route.params;
  const { getAgent } = useAgents();
  const agent = getAgent(agentId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telegram, setTelegram] = useState<TelegramConnectionStatus | null>(null);
  const [discord, setDiscord] = useState<DiscordConnectionStatus | null>(null);
  const [channelId, setChannelId] = useState('');

  const isTelegram = agent?.origin === 'Telegram';
  const isDiscord = agent?.origin === 'Discord';

  const load = useCallback(async () => {
    if (!agent) return;
    setLoading(true);
    if (agent.origin === 'Telegram') {
      const status = await fetchTelegramConnectionStatus(agentId);
      setTelegram(status);
    } else if (agent.origin === 'Discord') {
      const status = await fetchDiscordConnectionStatus(agentId);
      setDiscord(status);
      setChannelId(status.channelId ?? '');
    }
    setLoading(false);
  }, [agent, agentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (agent.origin !== 'Telegram' && agent.origin !== 'Discord') {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0 }}>
        <StatusBar barStyle="light-content" />
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevL" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, marginBottom: 8 }}>No platform link</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20 }}>
            {agent.name} is hosted in AgentHQ only — there's no Telegram or Discord connection to manage.
          </Text>
        </View>
      </View>
    );
  }

  const handleSaveChannel = async () => {
    if (!channelId.trim()) {
      Alert.alert('Channel required', 'Paste your Discord channel ID to enable two-way sync.');
      return;
    }
    setSaving(true);
    const result = await updateDiscordChannel(agentId, channelId);
    setSaving(false);
    if (result.error) {
      Alert.alert('Could not update', result.error);
      return;
    }
    await load();
    Alert.alert('Channel updated', 'Two-way sync will use this channel. Open chat to pull recent messages.');
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect platform?',
      `This removes the ${agent.origin} link for ${agent.name}. The agent stays on your roster — you can re-import later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const result = isTelegram
              ? await disconnectTelegram(agentId)
              : await disconnectDiscord(agentId);
            if (result.error) {
              Alert.alert('Could not disconnect', result.error);
              return;
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const connected = isTelegram ? telegram?.connected : discord?.connected;
  const botUsername = isTelegram ? telegram?.botUsername : discord?.botUsername;

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Platform connection</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>{agent.origin} · {agent.name}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={C.a} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, backgroundColor: C.c1, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
            <AgentAvatar agent={agent} size={48} showStatus={false} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text }}>{agent.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <PlatformLogo id={agent.origin.toLowerCase()} size={16} />
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim }}>
                  {botUsername ? `@${botUsername}` : agent.origin}
                </Text>
              </View>
            </View>
            <StatusPill ok={!!connected} label={connected ? 'Linked' : 'Not linked'} />
          </View>

          {isTelegram && telegram && (
            <>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Telegram status
              </Text>
              <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 20, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>Bot linked</Text>
                  <StatusPill ok={telegram.connected} label={telegram.connected ? 'Yes' : 'No'} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>Chat registered</Text>
                  <StatusPill ok={!!telegram.hasChat} label={telegram.hasChat ? 'Ready' : 'Send hi first'} />
                </View>
              </View>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 24 }}>
                Open Telegram and message your bot once (e.g. "hi") so dispatch and replies know your chat ID. Bot tokens can't be changed here — re-import to swap bots.
              </Text>
            </>
          )}

          {isDiscord && discord && (
            <>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Discord channel
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 12 }}>
                Two-way sync posts and reads messages in this channel. Right-click the channel in Discord → Copy Channel ID.
              </Text>
              <TextInput
                value={channelId}
                onChangeText={setChannelId}
                placeholder="1234567890123456789"
                placeholderTextColor={C.textMuted}
                keyboardType="number-pad"
                style={{
                  backgroundColor: C.c2,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 14,
                  padding: 16,
                  color: C.text,
                  fontFamily: FONTS.regular,
                  fontSize: 16,
                  marginBottom: 12,
                }}
              />
              {discord.hasChannel && discord.lastSyncAt ? (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, marginBottom: 16 }}>
                  Last synced · {new Date(discord.lastSyncAt).toLocaleString()}
                </Text>
              ) : null}
              <PrimaryButton onPress={handleSaveChannel} disabled={saving || channelId.trim() === (discord.channelId ?? '')}>
                {saving ? 'Saving…' : discord.hasChannel ? 'Update channel' : 'Link channel'}
              </PrimaryButton>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19, marginTop: 16 }}>
                Enable Message Content Intent in the Discord Developer Portal. Bot tokens can't be changed here — re-import to swap bots.
              </Text>
            </>
          )}

          {connected && (
            <View style={{ marginTop: 32 }}>
              <SecondaryButton onPress={handleDisconnect}>Disconnect {agent.origin}</SecondaryButton>
            </View>
          )}

          {!connected && (
            <View style={{ marginTop: 24, padding: 16, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20 }}>
                No active connection found. Re-import this agent from Add agent → Import from {agent.origin}.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
