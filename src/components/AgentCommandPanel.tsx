import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { C, FONTS } from '../constants/theme';
import {
  AgentCommand, AgentReport, OPEN_STATUSES, isAgentStale, STATUS_LABEL,
  cancelCommand, fetchCommands, fetchReports, sendCommand,
} from '../lib/commandsApi';

const POLL_MS = 3000;

function statusColor(s: AgentCommand['status']): string {
  if (s === 'done') return C.online;
  if (s === 'failed') return C.busy;
  if (s === 'needs_review') return C.away;
  if (s === 'cancelled') return C.offline;
  return C.b;
}

const KIND_LABEL: Record<AgentReport['kind'], string> = {
  ack: 'Task accepted',
  progress: 'Working',
  result: 'Finished',
  error: 'Hit a problem',
  stop: 'Stopped',
  heartbeat: 'Checked in',
};

type TimelineRow = { id: string; label: string; at: string };

/** One timeline row: green check when done, spinner while it is the live step, ! on failure, ? when waiting for approval. */
function TimelineRowView({ row, state }: { row: TimelineRow; state: 'done' | 'live' | 'failed' | 'approval' }) {
  const time = new Date(row.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
      {state === 'live' ? (
        <ActivityIndicator size="small" color={C.b} style={{ width: 18 }} />
      ) : state === 'failed' ? (
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.busy, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.busy, fontSize: 11, fontFamily: FONTS.semibold }}>!</Text>
        </View>
      ) : state === 'approval' ? (
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.away, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.away, fontSize: 11, fontFamily: FONTS.semibold }}>?</Text>
        </View>
      ) : (
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(163,230,53,0.12)', borderWidth: 1.5, borderColor: C.online, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.online, fontSize: 10, fontFamily: FONTS.semibold }}>OK</Text>
        </View>
      )}
      <Text style={{ flex: 1, color: state === 'live' ? C.text : C.textDim, fontFamily: state === 'live' ? FONTS.medium : FONTS.regular, fontSize: 13 }}>
        {row.label}
      </Text>
      <Text style={{ color: C.textMuted, fontFamily: FONTS.mono, fontSize: 10 }}>{time}</Text>
    </View>
  );
}

/** Give your agent a job, watch it report back, stop it if needed. */
export default function AgentCommandPanel({ agentId }: { agentId: string }) {
  const [stale, setStale] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [reports, setReports] = useState<Record<string, AgentReport[]>>({});

  const load = useCallback(async () => {
    const { data: a } = await supabase.from('agents').select('last_heartbeat_at').eq('id', agentId).single();
    setStale(isAgentStale((a as any)?.last_heartbeat_at));
    const list = await fetchCommands(agentId, 5);
    setCommands(list);
    const entries = await Promise.all(list.map(async c => [c.id, await fetchReports(c.id)] as const));
    setReports(Object.fromEntries(entries));
  }, [agentId]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const onSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    const res = await sendCommand(agentId, value);
    setSending(false);
    if (res.error) { setError(res.error); return; }
    setText('');
    load();
  };

  const onStop = async (id: string) => {
    const err = await cancelCommand(id);
    if (err) setError(err);
    load();
  };

  return (
    <View style={{ marginTop: 28 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
        Task activity
      </Text>
      {stale && (
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.away, marginBottom: 8 }}>
          Status unknown: this agent has not checked in for 10+ minutes. Your command will wait until it does.
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="e.g. Check the deployment status"
          placeholderTextColor={C.textMuted}
          style={{ flex: 1, minWidth: 0, color: C.text, backgroundColor: C.c2, borderColor: C.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: FONTS.regular }}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={onSend} disabled={sending || !text.trim()} style={{ backgroundColor: C.a, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', opacity: sending || !text.trim() ? 0.5 : 1 }}>
          {sending ? <ActivityIndicator color={C.c0} /> : <Text style={{ fontFamily: FONTS.semibold, color: C.c0 }}>Send</Text>}
        </TouchableOpacity>
      </View>
      {error && <Text style={{ color: C.busy, marginTop: 8, fontFamily: FONTS.regular, fontSize: 12 }}>{error}</Text>}

      {commands.length === 0 && (
        <Text style={{ color: C.textMuted, fontFamily: FONTS.regular, fontSize: 13, marginTop: 12 }}>
          No updates yet.
        </Text>
      )}
      {commands.map(c => {
        const open = OPEN_STATUSES.includes(c.status);
        const rows: TimelineRow[] = [
          { id: `cmd-${c.id}`, label: `Task sent: ${c.command}`, at: c.createdAt },
          ...(reports[c.id] ?? [])
            .filter(r => r.kind !== 'heartbeat')
            .map(r => ({ id: r.id, label: r.message || KIND_LABEL[r.kind], at: r.createdAt })),
        ];
        const lastState =
          c.status === 'failed' ? 'failed'
          : c.status === 'needs_review' ? 'approval'
          : open ? 'live'
          : 'done';
        return (
          <View key={c.id} style={{ marginTop: 12, backgroundColor: C.c1, borderColor: C.borderStrong, borderWidth: 1, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: statusColor(c.status), fontFamily: FONTS.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                {c.status === 'needs_review' ? 'Waiting for approval' : STATUS_LABEL[c.status]}{c.progress != null && open ? ` · ${c.progress}%` : ''}
              </Text>
              {open && (
                <TouchableOpacity onPress={() => onStop(c.id)} style={{ marginLeft: 'auto' }}>
                  <Text style={{ color: C.busy, fontFamily: FONTS.semibold, fontSize: 12 }}>Stop</Text>
                </TouchableOpacity>
              )}
            </View>
            {rows.map((row, i) => (
              <TimelineRowView key={row.id} row={row} state={i === rows.length - 1 ? lastState : 'done'} />
            ))}
            {c.result && <Text style={{ color: C.textDim, fontFamily: FONTS.regular, marginTop: 10 }}>{c.result}</Text>}
          </View>
        );
      })}
    </View>
  );
}
