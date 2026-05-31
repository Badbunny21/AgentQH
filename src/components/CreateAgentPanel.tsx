import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { C, FONTS } from '../constants/theme';
import { AGENT_TEMPLATES, AGENTHQ_ORIGIN, AgentTemplate } from '../constants/agentTemplates';
import { AgentForm, EMPTY_AGENT_FORM, originLabel } from './AgentForm';
import { PrimaryButton } from './Buttons';
import { useAgents } from '../contexts/AgentsContext';

interface CreateAgentPanelProps {
  onAgentCreated: (agentId: string) => void;
  showCustomizeByDefault?: boolean;
}

export default function CreateAgentPanel({ onAgentCreated, showCustomizeByDefault = false }: CreateAgentPanelProps) {
  const { addAgent } = useAgents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(showCustomizeByDefault);
  const [form, setForm] = useState({ ...EMPTY_AGENT_FORM, originId: 'manual' });

  const createFromTemplate = async (template: AgentTemplate) => {
    setError(null);
    setLoading(true);
    const result = await addAgent({
      name: template.name,
      role: template.role,
      origin: AGENTHQ_ORIGIN,
      bio: template.bio,
    });
    setLoading(false);

    if (result.error || !result.agent) {
      setError(result.error || 'Could not create agent.');
      return;
    }
    onAgentCreated(result.agent.id);
  };

  const createCustom = async () => {
    setError(null);
    if (!form.name.trim() || !form.role.trim()) {
      setError('Name and role are required.');
      return;
    }

    setLoading(true);
    const result = await addAgent({
      name: form.name,
      role: form.role,
      origin: form.originId === 'manual' ? AGENTHQ_ORIGIN : originLabel(form.originId),
      bio: form.bio,
    });
    setLoading(false);

    if (result.error || !result.agent) {
      setError(result.error || 'Could not create agent.');
      return;
    }
    onAgentCreated(result.agent.id);
  };

  if (showCustomize) {
    return (
      <View>
        <AgentForm values={form} onChange={setForm} />
        {error && <ErrorBanner message={error} />}
        <View style={{ marginTop: 16, gap: 10 }}>
          <PrimaryButton onPress={createCustom} disabled={loading} icon="plus">
            {loading ? 'Creating…' : 'Create & chat'}
          </PrimaryButton>
          {!showCustomizeByDefault && (
            <TouchableOpacity onPress={() => setShowCustomize(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textDim }}>Back to templates</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
        Pick a starting point
      </Text>
      {AGENT_TEMPLATES.map(template => (
        <TouchableOpacity
          key={template.id}
          onPress={() => createFromTemplate(template)}
          disabled={loading}
          style={{
            backgroundColor: C.c1,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: loading ? 0.6 : 1,
          }}
          activeOpacity={0.8}
        >
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: template.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 18, color: '#0a0a0a' }}>
              {template.name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: C.text, letterSpacing: -0.3 }}>{template.label}</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, marginTop: 3, lineHeight: 18 }}>{template.description}</Text>
          </View>
          {loading ? <ActivityIndicator color={C.a} /> : null}
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => setShowCustomize(true)} style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.a }}>Customize from scratch</Text>
      </TouchableOpacity>

      {error && <ErrorBanner message={error} />}
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={{ backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: '#f87171' }}>{message}</Text>
    </View>
  );
}
