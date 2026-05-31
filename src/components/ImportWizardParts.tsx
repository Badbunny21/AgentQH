import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { C, FONTS } from '../constants/theme';

export function ImportStepHeader({
  step,
  totalSteps,
  stepLabel,
  title,
  subtitle,
}: {
  step: number;
  totalSteps: number;
  stepLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.a, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        STEP {step + 1} / {totalSteps} · {stepLabel.toUpperCase()}
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

export function ImportField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  secureTextEntry,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  hint?: string;
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
      {hint ? (
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textMuted, marginTop: 8, lineHeight: 17, paddingHorizontal: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ImportReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim }}>{label}</Text>
      <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.text, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export function ImportErrorBanner({ message }: { message: string }) {
  return (
    <View style={{ marginTop: 8, backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: '#f87171', lineHeight: 20 }}>{message}</Text>
    </View>
  );
}
