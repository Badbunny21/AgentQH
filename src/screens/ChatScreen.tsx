import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { ChatMessage } from '../lib/messageUtils';
import { fetchMessages, insertMessage } from '../lib/messagesApi';
import { fetchMemoryTextsForAgent, createMemory } from '../lib/memoriesApi';
import { suggestMemoriesFromChat } from '../lib/memoryExtractApi';
import { MemoryCandidate } from '../lib/memoryUtils';
import { logActivity } from '../lib/activitiesApi';
import { syncDiscordMessages, relayDiscordMessage } from '../lib/discordImportApi';
import { generateAgentReply, isChatConfigured } from '../lib/agentChatApi';
import { isLocalOpenAIConfigured } from '../lib/openaiLocal';
import AgentAvatar from '../components/AgentAvatar';
import MemorySuggestionBar from '../components/MemorySuggestionBar';
import Icon from '../components/Icon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

function TypingDots() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, paddingHorizontal: 14, backgroundColor: C.c2, borderRadius: 20, borderTopLeftRadius: 4, borderWidth: 1, borderColor: C.border }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.textDim, transform: [{ translateY: anim }] }}
        />
      ))}
    </View>
  );
}

function ChatBubble({ message, isUser }: { message: ChatMessage; isUser: boolean }) {
  if (isUser) {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 6 }}>
        <LinearGradient
          colors={['#a3e635', '#22d3ee', '#e879f9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ maxWidth: '78%', borderRadius: 20, borderTopRightRadius: 6, padding: 11, paddingHorizontal: 15 }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: '#0a0a0a', letterSpacing: -0.2, lineHeight: 21 }}>
            {message.text}
          </Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'flex-start', marginBottom: 6 }}>
      <View style={{ maxWidth: '78%', backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, borderRadius: 20, borderTopLeftRadius: 6, padding: 11, paddingHorizontal: 15 }}>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.text, letterSpacing: -0.2, lineHeight: 21 }}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { agentId } = route.params;
  const { session, refreshProfile } = useAuth();
  const { getAgent } = useAgents();
  const agent = getAgent(agentId);
  const userId = session?.user.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memorySuggestions, setMemorySuggestions] = useState<MemoryCandidate[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const loadMessages = useCallback(async (options?: { syncAutoReply?: boolean; showLoader?: boolean }) => {
    if (!userId) return;
    if (options?.showLoader !== false) {
      setLoadingHistory(true);
    }
    if (agent?.origin === 'Discord') {
      await syncDiscordMessages(agentId, options?.syncAutoReply === true);
    }
    const history = await fetchMessages(userId, agentId);
    setMessages(history);
    setLoadingHistory(false);
  }, [userId, agentId, agent?.origin]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      if (agent?.origin !== 'Discord' || !userId) return;

      let active = true;
      const poll = async () => {
        if (!active) return;
        const result = await syncDiscordMessages(agentId, true);
        if (!active) return;
        if (result.synced > 0 || result.replied > 0) {
          const history = await fetchMessages(userId, agentId);
          if (active) setMessages(history);
        }
      };

      void poll();
      const intervalId = setInterval(poll, 12000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [agentId, agent?.origin, userId])
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping, loadingHistory, memorySuggestions]);

  const extractMemorySuggestions = async (userMessage: string, agentReply: string, existingMemories: string[]) => {
    const result = await suggestMemoriesFromChat(
      agentId,
      userMessage,
      agentReply,
      existingMemories,
      agent?.name
    );
    if (result.candidates.length > 0) {
      setMemorySuggestions(result.candidates);
    }
  };

  const handleSaveMemory = async (candidate: MemoryCandidate) => {
    if (!userId) return { error: 'Not signed in.' };
    const result = await createMemory(userId, agentId, candidate.text, candidate.category);
    if (result.error) return { error: result.error };

    await logActivity(
      userId,
      'memory_saved',
      `${agent.name} learned: ${candidate.text.slice(0, 80)}${candidate.text.length > 80 ? '…' : ''}`,
      { agentId }
    );
    setMemorySuggestions(prev => prev.filter(c => c.text !== candidate.text));
    return { error: null };
  };

  const handleDismissMemory = (candidate: MemoryCandidate) => {
    setMemorySuggestions(prev => prev.filter(c => c.text !== candidate.text));
  };

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: C.text, marginBottom: 8 }}>Agent not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const send = async () => {
    const text = draft.trim();
    if (!text || !userId || isTyping) return;

    setError(null);
    setDraft('');
    setMemorySuggestions([]);
    setIsTyping(true);

    const isDiscord = agent.origin === 'Discord';

    if (isDiscord) {
      const userRelay = await relayDiscordMessage(agentId, 'user', text);
      if (userRelay.error) {
        setIsTyping(false);
        setError(userRelay.error);
        setDraft(text);
        return;
      }
    } else {
      const userResult = await insertMessage(userId, agentId, 'user', text);
      if (userResult.error || !userResult.message) {
        setIsTyping(false);
        setError(userResult.error || 'Could not send message.');
        setDraft(text);
        return;
      }
    }

    const withUser = await fetchMessages(userId, agentId);
    setMessages(withUser);

    const memories = await fetchMemoryTextsForAgent(userId, agentId);
    const aiResult = await generateAgentReply(agent, withUser, text, memories);

    if (aiResult.error || !aiResult.reply) {
      setIsTyping(false);
      setError(aiResult.error || 'Could not get a reply.');
      if (aiResult.limitReached) {
        await refreshProfile();
      }
      return;
    }

    if (isDiscord) {
      const agentRelay = await relayDiscordMessage(agentId, 'agent', aiResult.reply);
      setIsTyping(false);
      await refreshProfile();
      if (agentRelay.error) {
        setError(agentRelay.error);
        return;
      }
    } else {
      const agentResult = await insertMessage(userId, agentId, 'agent', aiResult.reply);
      setIsTyping(false);
      await refreshProfile();
      if (agentResult.error || !agentResult.message) {
        setError(agentResult.error || 'Reply received but could not save.');
        return;
      }
    }

    const updated = await fetchMessages(userId, agentId);
    setMessages(updated);

    void extractMemorySuggestions(text, aiResult.reply, memories);
  };

  const isDiscordLinked = agent.origin === 'Discord';

  const statusLabel = isTyping ? 'TYPING…' : { online: 'ONLINE', away: 'AWAY', busy: 'BUSY', offline: 'OFFLINE' }[agent.status];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.c0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />

      <View style={{ paddingTop: insets.top + 10, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.c0 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="chevL" size={18} color={C.text} />
        </TouchableOpacity>
        <AgentAvatar agent={agent} size={38} statusVariant="pulse" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 15, color: C.text, letterSpacing: -0.3 }}>
            {agent.name}
          </Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: isTyping ? C.a : C.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>
            {isDiscordLinked ? (isTyping ? 'TYPING…' : 'DISCORD · LIVE SYNC') : statusLabel}
          </Text>
        </View>
      </View>

      {!isChatConfigured() && (
        <View style={{ marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#fbbf24', lineHeight: 18 }}>
            Chat is temporarily unavailable. Messages still save to your account.
          </Text>
        </View>
      )}

      {isLocalOpenAIConfigured() && (
        <View style={{ marginHorizontal: 16, marginTop: 12, padding: 10, backgroundColor: C.c1, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textMuted, letterSpacing: 0.5 }}>
            DEV · using local API key
          </Text>
        </View>
      )}

      {error && (
        <View style={{ marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: '#f87171', lineHeight: 18 }}>{error}</Text>
          {error.includes('limit') && (
            <TouchableOpacity onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: C.a }}>See upgrade options →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: loadingHistory ? 1 : undefined }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {loadingHistory ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={C.a} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 17, color: C.text, marginBottom: 8 }}>Start a conversation</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center', lineHeight: 20 }}>
              Say hi to {agent.name}. Messages are saved to your account.
            </Text>
          </View>
        ) : (
          messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} isUser={msg.role === 'user'} />
          ))
        )}
        {isTyping && (
          <View style={{ alignItems: 'flex-start', marginBottom: 6 }}>
            <TypingDots />
          </View>
        )}
      </ScrollView>

      <MemorySuggestionBar
        candidates={memorySuggestions}
        agentName={agent.name}
        onSave={handleSaveMemory}
        onDismiss={handleDismissMemory}
      />

      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 12, flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.c0 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder={`Message ${agent.name}…`}
          placeholderTextColor={C.textMuted}
          returnKeyType="send"
          editable={!isTyping}
          style={{ flex: 1, height: 44, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 18, color: C.text, fontFamily: FONTS.regular, fontSize: 15, letterSpacing: -0.2 }}
        />
        <TouchableOpacity onPress={send} disabled={isTyping || !draft.trim()} style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', flexShrink: 0, opacity: isTyping || !draft.trim() ? 0.5 : 1 }}>
          <LinearGradient
            colors={['#a3e635', '#22d3ee', '#e879f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="send" size={18} color="#0a0a0a" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
