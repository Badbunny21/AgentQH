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
import useAgentConnection from '../hooks/useAgentConnection';
import { connectionLabel } from '../lib/agentConnection';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ConnectedPlatforms'> };
function ConnectionRow({ agentId, name, navigation }: { agentId: string; name: string; navigation: Props['navigation'] }) {
  const connection = useAgentConnection(agentId);
  return (
    <TouchableOpacity onPress={() => navigation.navigate('AgentProfile', { agentId })} style={{ padding: 16, marginBottom: 12, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <PlatformLogo id={connection} color={C.a} size={24} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.text }}>{name}</Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 4 }}>{connectionLabel(connection)}</Text>
      </View>
      <Icon name="chevR" size={14} color={C.textMuted} />
    </TouchableOpacity>
  );
}
export default function ConnectedPlatformsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { agents } = useAgents();
  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}><Icon name="chevL" size={18} color={C.text} /></TouchableOpacity>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text }}>Connections</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20, marginBottom: 20 }}>Saved Telegram and Discord connections. A connection is not proof that an agent is running.</Text>
        {agents.length === 0 && <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, marginBottom: 20 }}>No agents yet. Import your own agent to get started.</Text>}
        {agents.map(agent => <ConnectionRow key={agent.id} agentId={agent.id} name={agent.name} navigation={navigation} />)}
        <PrimaryButton onPress={() => navigation.navigate('AddAgent')} icon="plus">Import agent</PrimaryButton>
      </ScrollView>
    </View>
  );
}
