import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { formatAuthError } from '../lib/authErrors';
import { C, FONTS } from '../constants/theme';
import Icon from '../components/Icon';
import { PrimaryButton } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
  route: RouteProp<RootStackParamList, 'Auth'>;
};

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
}

function InputField({ label, value, onChangeText, secureTextEntry, placeholder, keyboardType }: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="none"
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
        }}
      />
    </View>
  );
}

export default function AuthScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(route.params?.mode || 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  const handleAuth = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (isSignUp && !agreed) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    const result = isSignUp
      ? await signUp(email, password, name)
      : await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(formatAuthError(result.error));
    } else if ('needsConfirmation' in result && result.needsConfirmation) {
      setMode('signin');
      setSuccess('Account created. Turn off "Confirm email" in Supabase for instant access, or confirm your user in Supabase → Users, then tap Sign in below.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.c0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Logo + Title */}
        <View style={{ paddingTop: insets.top + 32, paddingHorizontal: 28 }}>
          <LinearGradient
            colors={['#a3e635', '#22d3ee', '#e879f9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" fill="rgba(10,10,15,0.85)" />
            </Svg>
          </LinearGradient>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 32, color: C.text, letterSpacing: -1, lineHeight: 33.6, marginBottom: 8 }}>
            {isSignUp ? 'Build your\nroster' : 'Welcome\nback'}
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, letterSpacing: -0.2 }}>
            {isSignUp ? 'Start with the agents you already use.' : 'Your crew is waiting.'}
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingTop: 36, paddingHorizontal: 28, gap: 14 }}>
          {isSignUp && (
            <InputField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          )}
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••••"
          />

          {success && (
            <View style={{ backgroundColor: 'rgba(163,230,53,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(163,230,53,0.3)' }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.a, lineHeight: 20 }}>
                {success}
              </Text>
            </View>
          )}

          {error && (
            <View style={{ backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: '#f87171', lineHeight: 20 }}>
                {error}
              </Text>
            </View>
          )}

          {isSignUp && (
            <TouchableOpacity
              onPress={() => setAgreed(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 }}
            >
              {agreed ? (
                <LinearGradient
                  colors={['#a3e635', '#22d3ee', '#e879f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}
                >
                  <Icon name="check" size={12} color="#0a0a0a" strokeWidth={3} />
                </LinearGradient>
              ) : (
                <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderStrong, marginTop: 1, flexShrink: 0 }} />
              )}
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, lineHeight: 18.85, flex: 1 }}>
                I agree to the{' '}
                <Text style={{ color: C.text }}>Terms</Text>
                {' '}and{' '}
                <Text style={{ color: C.text }}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
          )}
          {!isSignUp && (
            <TouchableOpacity style={{ paddingVertical: 4 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textDim }}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{ position: 'absolute', left: 28, right: 28, bottom: insets.bottom + 32 }}>
        <PrimaryButton onPress={handleAuth} disabled={loading}>
          {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : isSignUp ? 'Create account' : 'Sign in'}
        </PrimaryButton>
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim }}>
            {isSignUp ? 'Already on the roster? ' : 'New here? '}
            <Text
              style={{ fontFamily: FONTS.semibold, color: C.text }}
              onPress={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null); setSuccess(null); }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
