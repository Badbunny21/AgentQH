import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Task } from '../contexts/TasksContext';
import { useAgents } from '../contexts/AgentsContext';
import { C, FONTS } from '../constants/theme';
import AgentAvatar from './AgentAvatar';
import Icon from './Icon';

interface TaskRowProps {
  task: Task;
  onToggle?: (id: string) => void;
  onPress?: (task: Task) => void;
}

function statusBadge(status: string, done: boolean, hasResult: boolean): { label: string; color: string } | null {
  if (done) return null;
  if (status === 'doing') return { label: 'Running', color: C.a };
  if (status === 'review' || hasResult) return { label: 'Review', color: '#22d3ee' };
  return null;
}

export default function TaskRow({ task, onToggle, onPress }: TaskRowProps) {
  const { agents } = useAgents();
  const agent = task.agentId ? agents.find(a => a.id === task.agentId) : undefined;
  const badge = statusBadge(task.status, task.done, !!task.result);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        paddingHorizontal: 14,
        backgroundColor: C.c1,
        borderWidth: 1,
        borderColor: task.status === 'review' ? 'rgba(34,211,238,0.35)' : C.border,
        borderRadius: 14,
      }}
    >
      <Pressable
        onPress={() => onToggle?.(task.id)}
        hitSlop={8}
        style={{ flexShrink: 0 }}
      >
        {task.done ? (
          <LinearGradient
            colors={['#a3e635', '#22d3ee', '#e879f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="check" size={12} color="#0a0a0a" strokeWidth={3} />
          </LinearGradient>
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderStrong }} />
        )}
      </Pressable>

      <Pressable
        onPress={() => onPress?.(task)}
        style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: task.done ? C.textDim : C.text,
              letterSpacing: -0.2,
              lineHeight: 19,
              textDecorationLine: task.done ? 'line-through' : 'none',
            }}
            numberOfLines={task.result ? 1 : 2}
          >
            {task.title}
          </Text>
          {task.result && !task.done && (
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 4, lineHeight: 17 }} numberOfLines={2}>
              {task.result}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {agent?.name ?? 'Unassigned'}
            </Text>
            {badge && (
              <>
                <Text style={{ color: C.textMuted, opacity: 0.5 }}>·</Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: badge.color, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {badge.label}
                </Text>
              </>
            )}
            <Text style={{ color: C.textMuted, opacity: 0.5 }}>·</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {task.time}
            </Text>
          </View>
        </View>
        {agent && <AgentAvatar agent={agent} size={28} showStatus={false} />}
      </Pressable>
    </View>
  );
}
