import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { MEMORY_CATEGORIES } from '../constants/data';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from '../contexts/AgentsContext';
import { fetchAllMemories, Memory } from '../lib/memoriesApi';
import { fetchMemoryStats } from '../lib/userStatsApi';
import AgentAvatar from '../components/AgentAvatar';
import Icon from '../components/Icon';
import { GhostChip } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Memory'>;
};

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 24, color: C.text, letterSpacing: -1, lineHeight: 24 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </Text>
    </View>
  );
}

function categoryLabel(category: string): { label: string; icon: string } {
  const known = MEMORY_CATEGORIES.find(c => c.id === category);
  if (known) return { label: known.label, icon: known.icon };
  if (category === 'general') return { label: 'General', icon: 'brain' };
  if (category === 'handoff') return { label: 'Handoffs', icon: 'arrow' };
  return { label: category, icon: 'brain' };
}

function formatMemoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MemoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { agents } = useAgents();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState({ factCount: 0, contributorCount: 0, topicCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const [allMemories, memoryStats] = await Promise.all([
      fetchAllMemories(session.user.id),
      fetchMemoryStats(session.user.id),
    ]);
    setMemories(allMemories);
    setStats(memoryStats);
    setLoading(false);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categories = useMemo(() => {
    const ids = new Set(memories.map(m => m.category || 'general'));
    return MEMORY_CATEGORIES.filter(c => ids.has(c.id)).concat(
      ids.has('general') && !MEMORY_CATEGORIES.some(c => c.id === 'general')
        ? [{ id: 'general', label: 'General', icon: 'brain' }]
        : []
    );
  }, [memories]);

  const filteredFacts = selectedCat === 'all'
    ? memories
    : memories.filter(m => (m.category || 'general') === selectedCat);

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}
          >
            <Icon name="chevL" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.a, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            What they know
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 30, color: C.text, letterSpacing: -1, lineHeight: 31.5, marginBottom: 8 }}>
            Memory
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, letterSpacing: -0.2, lineHeight: 21 }}>
            Everything your crew has learned. You own it. You can edit it. You can take it back.
          </Text>
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 18, padding: 14, paddingHorizontal: 18, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: C.radius, flexDirection: 'row' }}>
          <StatBlock value={loading ? '…' : stats.factCount} label="Facts" />
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 2 }} />
          <StatBlock value={loading ? '…' : stats.contributorCount} label="Contributors" />
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 2 }} />
          <StatBlock value={loading ? '…' : stats.topicCount} label="Topics" />
        </View>

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 6 }}>
            <GhostChip active={selectedCat === 'all'} onPress={() => setSelectedCat('all')}>All</GhostChip>
            {categories.map(cat => (
              <GhostChip
                key={cat.id}
                active={selectedCat === cat.id}
                icon={cat.icon}
                onPress={() => setSelectedCat(cat.id)}
              >
                {cat.label}
              </GhostChip>
            ))}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}>
          {loading ? (
            <ActivityIndicator color={C.a} style={{ paddingVertical: 32 }} />
          ) : filteredFacts.length === 0 ? (
            <View style={{ padding: 28, alignItems: 'center', backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
              <Icon name="brain" size={28} color={C.textMuted} />
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text, marginTop: 14, marginBottom: 6 }}>No memories yet</Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, textAlign: 'center', lineHeight: 19 }}>
                Add facts from any agent profile — they’re used in chat and task execution.
              </Text>
            </View>
          ) : (
            filteredFacts.map(memory => {
              const cat = categoryLabel(memory.category || 'general');
              const agent = memory.agentId ? agents.find(a => a.id === memory.agentId) : undefined;
              return (
                <View
                  key={memory.id}
                  style={{ backgroundColor: C.c1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, paddingHorizontal: 16 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name={cat.icon} size={12} color={C.a} />
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 }}>
                      {cat.label}
                    </Text>
                    {agent && <AgentAvatar agent={agent} size={20} showStatus={false} />}
                  </View>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.text, letterSpacing: -0.2, lineHeight: 20.3 }}>
                    {memory.text}
                  </Text>
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {agent ? `${agent.name} · ` : ''}{formatMemoryDate(memory.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ marginHorizontal: 16, marginBottom: 32, padding: 16, backgroundColor: C.c1, borderWidth: 1, borderStyle: 'dashed', borderColor: C.borderStrong, borderRadius: C.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.c2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={16} color={C.a} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: C.text, letterSpacing: -0.2 }}>
              Stored in your account
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, letterSpacing: -0.1, marginTop: 2, lineHeight: 16.8 }}>
              Memory lives in Supabase under your profile. Export or delete anytime from the You tab.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
