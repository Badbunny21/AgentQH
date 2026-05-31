import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useAgents } from '../contexts/AgentsContext';
import Icon from '../components/Icon';
import PlatformLogo from '../components/PlatformLogo';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { ImportErrorBanner, ImportField, ImportReviewRow, ImportStepHeader } from '../components/ImportWizardParts';
import { validateDiscordBot, importDiscordAgent } from '../lib/discordImportApi';
import { parseConversationPaste, parseMemoryLines } from '../lib/importUtils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ImportDiscord'>;
  route: RouteProp<RootStackParamList, 'ImportDiscord'>;
};

const STEPS = ['Connect bot', 'Agent profile', 'Import memory', 'Review'];
const ACCENT = '#a3e635';

export default function ImportDiscordScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshAgents } = useAgents();
  const fromOnboarding = route.params?.fromOnboarding ?? false;

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [channelId, setChannelId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [memoriesText, setMemoriesText] = useState('');
  const [conversationText, setConversationText] = useState('');

  const memoryPreview = useMemo(() => parseMemoryLines(memoriesText), [memoriesText]);
  const conversationPreview = useMemo(
    () => parseConversationPaste(conversationText, name),
    [conversationText, name]
  );

  const handleValidateToken = async () => {
    setError(null);
    if (!botToken.trim()) {
      setError('Paste your bot token from the Discord Developer Portal.');
      return;
    }

    setLoading(true);
    const result = await validateDiscordBot(botToken.trim());
    setLoading(false);

    if (result.error || !result.data) {
      setError(result.error || 'Could not verify bot.');
      return;
    }

    setBotUsername(result.data.botUsername);
    if (!name.trim()) setName(result.data.botDisplayName);
    setStep(1);
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);

    const result = await importDiscordAgent({
      botToken: botToken.trim(),
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      memoriesText,
      conversationText,
      channelId: channelId.trim(),
    });

    setLoading(false);

    if (result.error || !result.data) {
      setError(result.error || 'Import failed.');
      if (result.partialAgentId) await refreshAgents();
      return;
    }

    await refreshAgents();
    if (fromOnboarding) {
      navigation.navigate('Migration');
      return;
    }
    navigation.replace('AgentProfile', { agentId: result.data.agentId });
  };

  const goBack = () => {
    setError(null);
    if (step === 0) navigation.goBack();
    else setStep(step - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity
          onPress={goBack}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Import from Discord</Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1, marginTop: 2 }}>{STEPS[step]}</Text>
        </View>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
          <PlatformLogo id="discord" size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <ImportStepHeader
              step={0}
              totalSteps={STEPS.length}
              stepLabel={STEPS[0]}
              title="Link your Discord bot"
              subtitle="Paste the bot token from the Discord Developer Portal. We'll verify it and prepare live channel sync."
            />
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, marginBottom: 8 }}>How to get your token</Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19 }}>
                1. Go to discord.com/developers/applications{'\n'}
                2. Select your app → Bot → Reset Token / Copy{'\n'}
                3. Enable Message Content Intent if you sync a server channel
              </Text>
            </View>
            <ImportField
              label="Bot token"
              value={botToken}
              onChangeText={setBotToken}
              placeholder="MTxxxxxxxxxx.xxxxxx.xxxxxxxxxxx"
              secureTextEntry
            />
          </>
        )}

        {step === 1 && (
          <>
            <ImportStepHeader
              step={1}
              totalSteps={STEPS.length}
              stepLabel={STEPS[1]}
              title="Set up the agent profile"
              subtitle="Paste your bot's system prompt or personality. Add a channel ID for two-way sync with AgentHQ."
            />
            {botUsername ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, backgroundColor: 'rgba(163,230,53,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(163,230,53,0.25)' }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: ACCENT }}>Connected · {botUsername}</Text>
              </View>
            ) : null}
            <ImportField label="Agent name" value={name} onChangeText={setName} placeholder="Nova" />
            <ImportField label="Role" value={role} onChangeText={setRole} placeholder="Community moderator" />
            <ImportField
              label="Instructions / personality"
              value={bio}
              onChangeText={setBio}
              placeholder="Paste the system prompt or description you use for this bot on Discord…"
              multiline
            />
            <ImportField
              label="Discord channel ID (recommended)"
              value={channelId}
              onChangeText={setChannelId}
              placeholder="1234567890123456789"
              hint="Enable Developer Mode → right-click channel → Copy Channel ID. Bot needs access to that channel."
            />
          </>
        )}

        {step === 2 && (
          <>
            <ImportStepHeader
              step={2}
              totalSteps={STEPS.length}
              stepLabel={STEPS[2]}
              title="Bring over memory"
              subtitle="Paste key facts and chats for history. With a channel ID, messages sync both ways — chat in AgentHQ or Discord, replies appear in both."
            />
            <ImportField
              label="Key facts (one per line)"
              value={memoriesText}
              onChangeText={setMemoriesText}
              placeholder={'Moderates #general\nKnows server rules by heart\nUses friendly tone'}
              multiline
            />
            {memoryPreview.length > 0 && (
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, marginBottom: 16 }}>
                {memoryPreview.length} fact{memoryPreview.length === 1 ? '' : 's'} ready to import
              </Text>
            )}
            <ImportField
              label="Conversation history (optional)"
              value={conversationText}
              onChangeText={setConversationText}
              placeholder={'User: Hey Nova\nNova: Welcome back! Need help with anything?\n\nUser: What are the server rules?'}
              multiline
            />
            {conversationPreview.length > 0 && (
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, marginBottom: 8 }}>
                {conversationPreview.length} message{conversationPreview.length === 1 ? '' : 's'} parsed
              </Text>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <ImportStepHeader
              step={3}
              totalSteps={STEPS.length}
              stepLabel={STEPS[3]}
              title="Ready to import"
              subtitle="Your agent appears on Home with memory and two-way Discord sync when a channel is linked."
            />
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18, gap: 12 }}>
              <ImportReviewRow label="Bot" value={botUsername} />
              <ImportReviewRow label="Agent" value={name} />
              <ImportReviewRow label="Role" value={role} />
              <ImportReviewRow label="Memory facts" value={String(memoryPreview.length)} />
              <ImportReviewRow label="Chat messages" value={String(conversationPreview.length)} />
              <ImportReviewRow label="Live sync" value={channelId.trim() ? 'Two-way channel linked' : 'App-only (no channel)'} />
            </View>
          </>
        )}

        {error && <ImportErrorBanner message={error} />}
      </ScrollView>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 10 }}>
        {step < 3 ? (
          <PrimaryButton
            onPress={() => {
              setError(null);
              if (step === 0) handleValidateToken();
              else if (step === 1) {
                if (!name.trim() || !role.trim()) {
                  setError('Name and role are required.');
                  return;
                }
                setStep(2);
              } else setStep(3);
            }}
            disabled={loading}
            icon={step === 0 ? 'share' : 'arrow'}
          >
            {loading ? 'Checking…' : step === 2 ? 'Review import' : 'Continue'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onPress={handleImport} disabled={loading} icon="plus">
            {loading ? 'Importing…' : 'Import to AgentHQ'}
          </PrimaryButton>
        )}
        {fromOnboarding && step === 0 && (
          <SecondaryButton onPress={() => navigation.goBack()}>Create agent manually instead</SecondaryButton>
        )}
      </View>
    </View>
  );
}
