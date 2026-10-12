import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Task } from '../contexts/TasksContext';
import { useAgents } from '../contexts/AgentsContext';
import { taskBoardLabel } from '../lib/taskBoardStatus';
import { C, FONTS, GRAD_KEYS } from '../constants/theme';
import AgentAvatar from './AgentAvatar';
import Icon from './Icon';

interface TaskRowProps {
  task: Task;
  board?: boolean;
  onToggle?: (id: string) => void;
  onPress?: (task: Task) => void;
}

function statusBadge(status: string, done: boolean, hasResult: boolean): { label: string; color: string } | null {
  if (done) return null;
  if (status === 'doing') return { label: 'Running', color: C.a };
  if (status === 'review' || hasResult) return { label: 'Review', color: '#22d3ee' };
  return null;
}

export default function TaskRow({ task, board = false, onToggle, onPress }: TaskRowProps) {
  const { agents } = useAgents();
  const agent = task.agentId ? agents.find(a => a.id === task.agentId) : undefined;
  const badge = statusBadge(task.status, task.done, !!task.result);

  if (board) {
    const color = agent ? GRAD_KEYS[agent.gradKey]?.[0] || C.a : C.textDim;
    const label = taskBoardLabel(task);
    const badgeColor = label === 'Error' ? C.busy : label === 'Review' ? C.b : C.a;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.c1, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 18 }}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.done }} accessibilityLabel={`Mark ${task.title} ${task.done ? 'open' : 'done'}`} onPress={() => onToggle?.(task.id)} hitSlop={8}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: task.done ? 0 : 1.5, borderColor: C.borderStrong, backgroundColor: task.done ? C.a : 'transparent' }} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open task: ${task.title}`} onPress={() => onPress?.(task)} style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={2} style={{ fontFamily: FONTS.medium, fontSize: 14, lineHeight: 19, color: task.done ? C.textDim : C.text, textDecorationLine: task.done ? 'line-through' : 'none' }}>{task.title}</Text>
            <Text numberOfLines={1} style={{ fontFamily: FONTS.medium, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color, marginTop: 4 }}>{agent?.name || 'Unassigned'}</Text>
          </View>
          {label && <View style={{ borderWidth: 1, borderColor: badgeColor, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ fontFamily: FONTS.semibold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6, color: badgeColor }}>{label}</Text></View>}
        </Pressable>
      </View>
    );
  }

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
