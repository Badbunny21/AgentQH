import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Switch, Linking, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAgents } from '../contexts/AgentsContext';
import { useAuth } from '../contexts/AuthContext';
import { setPushNotificationsEnabled, registerForPushNotificationsAsync, savePushToken } from '../lib/pushNotifications';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
  route: RouteProp<RootStackParamList, 'Settings'>;
};

function SettingsRow({
  icon,
  title,
  detail,
  onPress,
  last = false,
}: {
  icon: string;
  title: string;
  detail?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={C.text} />
      </View>
      <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: C.text }}>{title}</Text>
      {detail ? (
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, letterSpacing: 0.5 }}>{detail}</Text>
      ) : null}
      <Icon name="chevR" size={14} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();
  const { session, profile, refreshProfile, deleteAccount } = useAuth();
  const section = route.params?.section;
  const notificationsOn = profile?.push_notifications_enabled !== false;
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  const toggleNotifications = async (value: boolean) => {
    if (!session?.user.id) return;
    const result = await setPushNotificationsEnabled(session.user.id, value);
    if (result.error) return;
    await refreshProfile();
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token) await savePushToken(session.user.id, token);
    }
  };

  const title = !section
    ? 'Settings'
    : section === 'notifications'
      ? 'Notifications'
      : section === 'privacy'
        ? 'Privacy'
        : 'Help & support';

  const connectedPlatforms = agents.filter(a => a.origin === 'Telegram' || a.origin === 'Discord').length;

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account forever?',
      'This permanently removes your profile, agents, messages, tasks, memories, and billing data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Last chance',
              'Your account and all data will be erased immediately.',
              [
                { text: 'Keep account', style: 'cancel' },
                {
                  text: 'Delete forever',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    const result = await deleteAccount();
                    setDeletingAccount(false);
                    if (result.error) {
                      Alert.alert('Could not delete account', result.error);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: section ? 24 : 16, paddingBottom: 60 }}>
        {!section && (
          <>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19, marginBottom: 16, paddingHorizontal: 4 }}>
              App preferences and account details not shown on your profile.
            </Text>
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, overflow: 'hidden' }}>
              <SettingsRow icon="bell" title="Notifications" detail={notificationsOn ? 'On' : 'Off'} onPress={() => navigation.push('Settings', { section: 'notifications' })} />
              <SettingsRow icon="lock" title="Privacy" onPress={() => navigation.push('Settings', { section: 'privacy' })} />
              <SettingsRow icon="share" title="Connected platforms" detail={String(connectedPlatforms)} onPress={() => navigation.navigate('ConnectedPlatforms')} />
              <SettingsRow icon="bolt" title="Help & support" onPress={() => navigation.push('Settings', { section: 'help' })} last />
            </View>
          </>
        )}

        {section === 'notifications' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.text }}>Push notifications</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginTop: 4, lineHeight: 18 }}>Task updates and agent activity</Text>
              </View>
              <Switch value={notificationsOn} onValueChange={toggleNotifications} trackColor={{ false: C.c3, true: C.a }} />
            </View>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 20 }}>
              You'll get push alerts when tasks finish, agents reply on Telegram, or handoffs land. In-app activity is always on the bell from Home.
            </Text>
          </>
        )}

        {section === 'privacy' && (
          <>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.text, lineHeight: 22, marginBottom: 16 }}>
              Your data lives in your Supabase account — agents, messages, tasks, and memories. AgentHQ does not sell your data.
            </Text>
            {[
              'Chat and task content is used only to run your agents.',
              'Stripe handles billing; we never store card numbers.',
              'You can export your data anytime from the You tab.',
              'Sign out to end your session on this device.',
            ].map(item => (
              <View key={item} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <Text style={{ color: C.a }}>·</Text>
                <Text style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20 }}>{item}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              style={{ marginTop: 20, padding: 16, backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)', alignItems: 'center' }}
            >
              {deletingAccount ? (
                <ActivityIndicator color="#f87171" />
              ) : (
                <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: '#f87171' }}>Delete account forever</Text>
              )}
            </TouchableOpacity>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 10 }}>
              Removes all your data permanently, including agents and chat history.
            </Text>
          </>
        )}

        {section === 'help' && (
          <>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.text, lineHeight: 22, marginBottom: 20 }}>
              Questions or feedback? We're building AgentHQ in the open — reach out anytime.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:support@agenthq.app?subject=AgentHQ%20Help')}
              style={{ padding: 16, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.a }}>Email support@agenthq.app</Text>
            </TouchableOpacity>
            <View style={{ padding: 16, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 14, color: C.text, marginBottom: 8 }}>Quick tips</Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 20 }}>
                · Assign tasks from an agent's profile{'\n'}
                · Add memory facts so agents remember context{'\n'}
                · Import Telegram bots to dispatch work there{'\n'}
                · Upgrade to Pro for more AI messages
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
