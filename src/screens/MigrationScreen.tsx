import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { C, FONTS } from '../constants/theme';
import AgentAvatar from '../components/AgentAvatar';
import PlatformLogo from '../components/PlatformLogo';
import { PrimaryButton } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Migration'>;
};

export default function MigrationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const { agents } = useAgents();

  const handleContinue = async () => {
    await completeOnboarding();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.a, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            WELCOME TO AGENTHQ
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 28, color: C.text, letterSpacing: -0.9, lineHeight: 30.8, marginBottom: 10 }}>
            Connect your first{'\n'}agent
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, letterSpacing: -0.2, lineHeight: 20 }}>
            Bring in an agent you already run on Telegram or Discord. AgentHQ shows its work and sends it commands. The agent keeps thinking where it lives.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Connect an agent
          </Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ImportTelegram', { fromOnboarding: true })}
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
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Hermes and other bots</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ImportDiscord', { fromOnboarding: true })}
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
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 2 }}>Bot + memory + sync</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {agents.length > 0 && (
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              On your roster ({agents.length})
            </Text>
            <View style={{ gap: 10 }}>
              {agents.map(agent => (
                <TouchableOpacity
                  key={agent.id}
                  onPress={() => navigation.navigate('AgentProfile', { agentId: agent.id })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: C.c1,
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <AgentAvatar agent={agent} size={44} showStatus={false} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text, letterSpacing: -0.3 }}>{agent.name}</Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginTop: 2 }}>{agent.role} · {agent.origin}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 10 }}>
        <PrimaryButton onPress={handleContinue} icon="arrow" disabled={agents.length === 0}>
          {agents.length === 0 ? 'Connect an agent to continue' : 'Continue to home'}
        </PrimaryButton>
      </View>
    </View>
  );
}
