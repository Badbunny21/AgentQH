import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Handoff } from '../lib/handoffsApi';
import { Task } from '../contexts/TasksContext';
import { useAgents } from '../contexts/AgentsContext';
import { C, FONTS } from '../constants/theme';
import AgentAvatar from './AgentAvatar';
import Icon from './Icon';

interface HandoffCardProps {
  handoff: Handoff;
  task?: Task | null;
  onPress?: (handoff: Handoff, task: Task | null) => void;
}

export function handoffStatus(task: Task | null | undefined): { label: string; color: string } {
  if (!task) return { label: 'Queued', color: C.textDim };
  if (task.done) return { label: 'Done', color: '#a3e635' };
  if (task.status === 'doing') return { label: 'Running', color: C.a };
  if (task.executionError) return { label: 'Failed', color: '#f87171' };
  if (task.result || task.status === 'review') return { label: 'Ready to review', color: '#22d3ee' };
  return { label: 'Waiting', color: C.textDim };
}

export default function HandoffCard({ handoff, task, onPress }: HandoffCardProps) {
  const { agents } = useAgents();
  const fromAgent = agents.find(a => a.id === handoff.fromAgentId);
  const toAgent = agents.find(a => a.id === handoff.toAgentId);
  const status = handoffStatus(task);
  const tappable = !!onPress && !!handoff.taskId;

  if (!fromAgent || !toAgent) return null;

  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <AgentAvatar agent={fromAgent} size={28} showStatus={false} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 14, height: 1, backgroundColor: C.borderStrong }} />
          <Icon name="arrow" size={10} color={C.textDim} strokeWidth={2.5} />
          <View style={{ width: 14, height: 1, backgroundColor: C.borderStrong }} />
        </View>
        <AgentAvatar agent={toAgent} size={28} showStatus={false} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 12.5, color: C.text, letterSpacing: -0.2 }}>
            {fromAgent.name}{' '}
            <Text style={{ fontFamily: FONTS.regular, color: C.textDim }}>briefed</Text>
            {' '}{toAgent.name}
          </Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>
            HANDOFF · {handoff.time}
          </Text>
        </View>
        <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: status.color, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {status.label}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: C.text, letterSpacing: -0.2, lineHeight: 19.5, paddingLeft: 4 }}>
        {handoff.summary}
      </Text>
      {task?.result && !task.done && (
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, lineHeight: 17, marginTop: 8, paddingLeft: 4 }} numberOfLines={2}>
          {task.result}
        </Text>
      )}
      {handoff.context && (
        <View
          style={{
            marginTop: 8,
            paddingVertical: 5,
            paddingHorizontal: 9,
            backgroundColor: C.c2,
            borderRadius: 6,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            FOR · {handoff.context}
          </Text>
        </View>
      )}
      {tappable && (
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.a, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 10, paddingLeft: 4 }}>
          Tap to view result →
        </Text>
      )}
    </>
  );

  if (!tappable) {
    return (
      <View
        style={{
          backgroundColor: C.c1,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 14,
          padding: 14,
          paddingHorizontal: 16,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(handoff, task ?? null)}
      activeOpacity={0.85}
      style={{
        backgroundColor: C.c1,
        borderWidth: 1,
        borderColor: task?.result ? 'rgba(34,211,238,0.35)' : C.border,
        borderRadius: 14,
        padding: 14,
        paddingHorizontal: 16,
      }}
    >
      {content}
    </TouchableOpacity>
  );
}
