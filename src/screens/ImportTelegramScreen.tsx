import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
import { validateTelegramBot, importTelegramAgent } from '../lib/telegramImportApi';
import { parseConversationPaste, parseMemoryLines } from '../lib/importUtils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ImportTelegram'>;
  route: RouteProp<RootStackParamList, 'ImportTelegram'>;
};

const STEPS = ['Connect bot', 'Agent profile', 'Import memory', 'Review'];

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.a, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        STEP {step + 1} / {STEPS.length} · {STEPS[step].toUpperCase()}
      </Text>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 26, color: C.text, letterSpacing: -0.8, lineHeight: 30, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, lineHeight: 20 }}>
        {subtitle}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: C.c2,
          borderWidth: 1,
          borderColor: focused ? C.a : C.border,
          borderRadius: 14,
          padding: 16,
          paddingHorizontal: 18,
          color: C.text,
          fontFamily: FONTS.regular,
          fontSize: 16,
          letterSpacing: -0.2,
          minHeight: multiline ? 120 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export default function ImportTelegramScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshAgents } = useAgents();
  const fromOnboarding = route.params?.fromOnboarding ?? false;

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
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
      setError('Paste your bot token from @BotFather.');
      return;
    }

    setLoading(true);
    const result = await validateTelegramBot(botToken.trim());
    setLoading(false);

    if (result.error || !result.data) {
      setError(result.error || 'Could not verify bot.');
      return;
    }

    setBotUsername(result.data.botUsername);
    if (!name.trim()) setName(result.data.botFirstName);
    setStep(1);
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);

    const result = await importTelegramAgent({
      botToken: botToken.trim(),
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      memoriesText,
      conversationText,
    });

    setLoading(false);

    if (result.error || !result.data) {
      setError(result.error || 'Import failed.');
      if (result.partialAgentId) {
        await refreshAgents();
      }
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
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, letterSpacing: -0.4 }}>Import from Telegram</Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1, marginTop: 2 }}>{STEPS[step]}</Text>
        </View>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#22d3ee', alignItems: 'center', justifyContent: 'center' }}>
          <PlatformLogo id="telegram" size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <StepHeader
              step={0}
              title="Link your Telegram bot"
              subtitle="Paste the token from @BotFather. We'll verify the bot and keep syncing new messages into AgentHQ."
            />
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, marginBottom: 8 }}>How to get your token</Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 19 }}>
                1. Open @BotFather in Telegram{'\n'}
                2. Send /mybots → pick your bot → API Token{'\n'}
                3. Copy and paste it below
              </Text>
            </View>
            <Field
              label="Bot token"
              value={botToken}
              onChangeText={setBotToken}
              placeholder="123456789:ABCdefGHI..."
              secureTextEntry
            />
          </>
        )}

        {step === 1 && (
          <>
            <StepHeader
              step={1}
              title="Set up the agent profile"
              subtitle="Paste your bot's instructions or personality. This becomes the agent's brain in AgentHQ."
            />
            {botUsername ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, backgroundColor: 'rgba(34,211,238,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34,211,238,0.25)' }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: '#22d3ee' }}>Connected · @{botUsername}</Text>
              </View>
            ) : null}
            <Field label="Agent name" value={name} onChangeText={setName} placeholder="Hermes" />
            <Field label="Role" value={role} onChangeText={setRole} placeholder="Personal assistant" />
            <Field
              label="Instructions / personality"
              value={bio}
              onChangeText={setBio}
              placeholder="Paste the system prompt or description you use for this bot on Telegram…"
              multiline
            />
          </>
        )}

        {step === 2 && (
          <>
            <StepHeader
              step={2}
              title="Bring over memory"
              subtitle="Telegram doesn't expose old chats via API — paste what matters and we'll store it here. New messages sync automatically."
            />
            <Field
              label="Key facts (one per line)"
              value={memoriesText}
              onChangeText={setMemoriesText}
              placeholder={'Prefers morning summaries\nKnows my timezone is EST\nAlways signs off with ⚡'}
              multiline
            />
            {memoryPreview.length > 0 && (
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.textDim, marginBottom: 16 }}>
                {memoryPreview.length} fact{memoryPreview.length === 1 ? '' : 's'} ready to import
              </Text>
            )}
            <Field
              label="Conversation history (optional)"
              value={conversationText}
              onChangeText={setConversationText}
              placeholder={'User: Hey Hermes\nHermes: Good morning! Ready to plan your day?\n\nUser: What\'s on my calendar?'}
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
            <StepHeader
              step={3}
              title="Ready to import"
              subtitle="Your agent will appear on Home with memory, chat history, and live Telegram sync."
            />
            <View style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18, gap: 12 }}>
              <Row label="Bot" value={`@${botUsername}`} />
              <Row label="Agent" value={name} />
              <Row label="Role" value={role} />
              <Row label="Memory facts" value={String(memoryPreview.length)} />
              <Row label="Chat messages" value={String(conversationPreview.length)} />
              <Row label="Live sync" value="Enabled" />
            </View>
          </>
        )}

        {error && (
          <View style={{ marginTop: 8, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: '#f87171', lineHeight: 20 }}>{error}</Text>
          </View>
        )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
