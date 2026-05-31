import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { C, FONTS } from '../constants/theme';
import { MemoryCandidate } from '../lib/memoryUtils';
import Icon from './Icon';

interface MemorySuggestionBarProps {
  candidates: MemoryCandidate[];
  agentName: string;
  onSave: (candidate: MemoryCandidate) => Promise<{ error: string | null }>;
  onDismiss: (candidate: MemoryCandidate) => void;
}

function SuggestionChip({
  candidate,
  agentName,
  onSave,
  onDismiss,
}: {
  candidate: MemoryCandidate;
  agentName: string;
  onSave: (candidate: MemoryCandidate) => Promise<{ error: string | null }>;
  onDismiss: (candidate: MemoryCandidate) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await onSave(candidate);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  };

  if (saved) {
    return (
      <View style={{ padding: 12, backgroundColor: 'rgba(163,230,53,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(163,230,53,0.25)' }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.a }}>Saved to {agentName}'s memory</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 14, backgroundColor: C.c1, borderRadius: 14, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="brain" size={14} color={C.a} />
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.a, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Remember this?
        </Text>
      </View>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.text, lineHeight: 20, marginBottom: 12 }}>
        {candidate.text}
      </Text>
      {error ? (
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: '#f87171', marginBottom: 10 }}>{error}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: C.a, alignItems: 'center', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="#0a0a0a" size="small" />
          ) : (
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: '#0a0a0a' }}>Save</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDismiss(candidate)}
          disabled={saving}
          style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textDim }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MemorySuggestionBar({ candidates, agentName, onSave, onDismiss }: MemorySuggestionBarProps) {
  if (candidates.length === 0) return null;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 4, gap: 8 }}>
      {candidates.map(candidate => (
        <SuggestionChip
          key={candidate.text}
          candidate={candidate}
          agentName={agentName}
          onSave={onSave}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}
