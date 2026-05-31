import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { C, FONTS } from '../constants/theme';
import { PLATFORMS } from '../constants/data';
import PlatformLogo from './PlatformLogo';

export const ORIGIN_OPTIONS = [
  ...PLATFORMS.map(p => ({ id: p.id, label: p.name })),
  { id: 'manual', label: 'Manual / Other' },
];

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function Field({ label, value, onChangeText, placeholder, multiline }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        multiline={multiline}
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
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export interface AgentFormValues {
  name: string;
  role: string;
  originId: string;
  bio: string;
}

interface AgentFormProps {
  values: AgentFormValues;
  onChange: (values: AgentFormValues) => void;
}

export function AgentForm({ values, onChange }: AgentFormProps) {
  const set = (patch: Partial<AgentFormValues>) => onChange({ ...values, ...patch });

  return (
    <View style={{ gap: 14 }}>
      <Field label="Name" value={values.name} onChangeText={name => set({ name })} placeholder="Maya" />
      <Field label="Role" value={values.role} onChangeText={role => set({ role })} placeholder="Research Lead" />

      <View>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
          Platform
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {ORIGIN_OPTIONS.map(option => {
            const active = values.originId === option.id;
            const platform = PLATFORMS.find(p => p.id === option.id);
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => set({ originId: option.id })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: active ? C.c3 : C.c2,
                  borderWidth: 1,
                  borderColor: active ? C.borderStrong : C.border,
                }}
              >
                {platform && (
                  <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: platform.color, alignItems: 'center', justifyContent: 'center' }}>
                    <PlatformLogo id={platform.id} size={14} />
                  </View>
                )}
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.text }}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Field
        label="Bio (optional)"
        value={values.bio}
        onChangeText={bio => set({ bio })}
        placeholder="What does this agent do for you?"
        multiline
      />
    </View>
  );
}

export function originLabel(originId: string): string {
  return ORIGIN_OPTIONS.find(o => o.id === originId)?.label || 'Manual';
}

export const EMPTY_AGENT_FORM: AgentFormValues = {
  name: '',
  role: '',
  originId: 'chatgpt',
  bio: '',
};
