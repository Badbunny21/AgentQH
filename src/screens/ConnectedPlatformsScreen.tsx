import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAgents } from '../contexts/AgentsContext';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
import PlatformLogo from '../components/PlatformLogo';
import { PrimaryButton } from '../components/Buttons';
import AgentAvatar from '../components/AgentAvatar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConnectedPlatforms'>;
};

const PLATFORM_ORIGINS = ['Telegram', 'Discord', 'AgentHQ'];

export default function ConnectedPlatformsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();

  const grouped = PLATFORM_ORIGINS.map(origin => ({
    origin,
    agents: agents.filter(a => a.origin === origin),
  })).filter(g => g.agents.length > 0 || g.origin !== 'AgentHQ');

  const importedCount = agents.filter(a => a.origin === 'Telegram' || a.origin === 'Discord').length;

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Connected platforms</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 20 }}>
          {importedCount > 0
            ? `${importedCount} agent${importedCount === 1 ? '' : 's'} linked to external platforms.`
            : 'No Telegram or Discord agents yet. Import a bot to dispatch tasks there.'}
        </Text>

        {grouped.map(group => (
          <View key={group.origin} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <PlatformLogo id={group.origin.toLowerCase()} size={18} />
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>{group.origin}</Text>
            </View>
            {group.agents.map(agent => (
              <View key={agent.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                >
                  <AgentAvatar agent={agent} size={36} showStatus={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.text }}>{agent.name}</Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>{agent.role}</Text>
                  </View>
                  <Icon name="chevR" size={14} color={C.textMuted} />
                </TouchableOpacity>
                {(group.origin === 'Telegram' || group.origin === 'Discord') && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditPlatformConnection', { agentId: agent.id })}
                    style={{ paddingHorizontal: 12, paddingVertical: 14, backgroundColor: C.c2, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
                  >
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textDim }}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}

        <PrimaryButton onPress={() => navigation.navigate('AddAgent')} icon="plus" style={{ marginTop: 8 }}>
          Import or add agent
        </PrimaryButton>
      </ScrollView>
    </View>
  );
}
