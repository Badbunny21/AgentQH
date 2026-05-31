import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_CHAT_LIMITS } from '../constants/plans';
import Icon from '../components/Icon';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { openBillingPortal, startProCheckout, syncSubscriptionFromStripe, verifyStripeSetup } from '../lib/stripeApi';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Upgrade'>;
};

interface PlanDef {
  id: string;
  planKey: 'free' | 'pro' | 'team';
  name: string;
  price: string;
  period: string;
  tagline: string;
  popular?: boolean;
  features: Array<{ t: string; y: boolean }>;
}

const PLAN_DEFS: PlanDef[] = [
  {
    id: 'starter',
    planKey: 'free',
    name: 'Starter',
    price: '$0',
    period: '/forever',
    tagline: 'Try the home.',
    features: [
      { t: '3 agents on roster', y: true },
      { t: `${PLAN_CHAT_LIMITS.free} AI chat messages / month`, y: true },
      { t: 'Task board', y: true },
      { t: 'Import from Telegram or Discord', y: true },
      { t: 'Dispatch tasks to agents', y: false },
      { t: 'Full memory vault', y: false },
    ],
  },
  {
    id: 'pro',
    planKey: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/mo',
    tagline: 'For real operators.',
    popular: true,
    features: [
      { t: '20 agents on roster', y: true },
      { t: `${PLAN_CHAT_LIMITS.pro.toLocaleString()} AI chat messages / month`, y: true },
      { t: 'Dispatch tasks to Telegram & Discord', y: true },
      { t: 'Full memory vault', y: true },
      { t: 'Agent-to-agent handoffs', y: true },
      { t: 'Priority support', y: true },
      { t: 'API + webhooks', y: false },
    ],
  },
  {
    id: 'team',
    planKey: 'team',
    name: 'Team',
    price: '$39',
    period: '/mo',
    tagline: 'When your crew has a crew.',
    features: [
      { t: '50 agents on roster', y: true },
      { t: `${PLAN_CHAT_LIMITS.team.toLocaleString()} AI chat messages / month`, y: true },
      { t: 'Team sharing + SSO', y: true },
      { t: 'API access + webhooks', y: true },
      { t: 'Full memory vault', y: true },
      { t: 'Agent-to-agent handoffs', y: true },
      { t: 'Priority support', y: true },
    ],
  },
];

function PlanCard({
  plan,
  isCurrent,
  loading,
  onUpgrade,
  onManage,
}: {
  plan: PlanDef;
  isCurrent: boolean;
  loading: boolean;
  onUpgrade?: () => void;
  onManage?: () => void;
}) {
  const cta = isCurrent
    ? 'Current plan'
    : plan.planKey === 'pro'
      ? 'Upgrade to Pro'
      : plan.planKey === 'team'
        ? 'Coming soon'
        : 'Current plan';

  return (
    <View
      style={{
        backgroundColor: plan.popular ? C.c2 : C.c1,
        borderWidth: 1,
        borderColor: plan.popular ? C.borderStrong : C.border,
        borderRadius: C.radius,
        padding: 22,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {plan.popular && (
        <>
          <View style={{ position: 'absolute', top: 0, right: 0, overflow: 'hidden', borderBottomLeftRadius: 12 }}>
            <LinearGradient
              colors={['#a3e635', '#22d3ee', '#e879f9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 6, paddingHorizontal: 14 }}
            >
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 9.5, color: '#0a0a0a', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Most Popular
              </Text>
            </LinearGradient>
          </View>
          <View style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, backgroundColor: C.a, opacity: 0.08, borderRadius: 100 }} />
        </>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 22, color: C.text, letterSpacing: -0.5 }}>
          {plan.name}
        </Text>
        {isCurrent && (
          <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: C.c3 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase' }}>Current</Text>
          </View>
        )}
      </View>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textDim, letterSpacing: -0.15, marginBottom: 14 }}>
        {plan.tagline}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 38, color: C.text, letterSpacing: -1.5, lineHeight: 38 }}>
          {plan.price}
        </Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, letterSpacing: -0.2 }}>
          {plan.period}
        </Text>
      </View>
      <View style={{ gap: 9, marginBottom: 20 }}>
        {plan.features.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {f.y ? (
              <LinearGradient
                colors={['#a3e635', '#22d3ee', '#e879f9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Icon name="check" size={11} color="#0a0a0a" strokeWidth={3} />
              </LinearGradient>
            ) : (
              <View style={{ width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <View style={{ width: 6, height: 1.5, backgroundColor: C.textMuted }} />
              </View>
            )}
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, letterSpacing: -0.2, color: f.y ? C.text : C.textMuted }}>
              {f.t}
            </Text>
          </View>
        ))}
      </View>
      {plan.planKey === 'pro' && !isCurrent ? (
        <PrimaryButton onPress={onUpgrade} disabled={loading}>
          {loading ? 'Opening checkout…' : cta}
        </PrimaryButton>
      ) : plan.planKey === 'pro' && isCurrent ? (
        <SecondaryButton onPress={onManage} disabled={loading}>
          {loading ? 'Loading…' : 'Manage subscription'}
        </SecondaryButton>
      ) : plan.popular ? (
        <PrimaryButton disabled>{cta}</PrimaryButton>
      ) : (
        <SecondaryButton disabled={isCurrent}>{cta}</SecondaryButton>
      )}
    </View>
  );
}

export default function UpgradeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, session, refreshProfile } = useAuth();
  const currentPlan = profile?.plan || 'free';
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    ok: boolean;
    checks: Record<string, { ok: boolean; detail: string }>;
    loading: boolean;
  }>({ ok: false, checks: {}, loading: true });

  const runStripeVerification = useCallback(async () => {
    setStripeStatus(prev => ({ ...prev, loading: true }));
    const result = await verifyStripeSetup();
    setStripeStatus({
      ok: result.ok,
      checks: result.checks,
      loading: false,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      runStripeVerification();
    }, [refreshProfile, runStripeVerification])
  );

  const handleUpgrade = async () => {
    if (!stripeStatus.ok && !stripeStatus.loading) {
      Alert.alert('Billing not ready', 'Stripe setup is incomplete. Check the status below.');
      return;
    }

    setLoading(true);
    const result = await startProCheckout();
    if (result.error) {
      setLoading(false);
      Alert.alert('Checkout failed', result.error);
      return;
    }
    if (result.success) {
      const sync = await syncSubscriptionFromStripe();
      await refreshProfile();
      setLoading(false);
      const upgraded = sync.plan === 'pro';
      Alert.alert(
        upgraded ? 'Welcome to Pro!' : 'Payment received',
        upgraded
          ? 'Your Pro plan is active — 20 agents and 2,000 AI messages/month.'
          : 'Payment went through but your plan has not synced yet. Tap "Restore plan from Stripe" below.'
      );
      return;
    }
    setLoading(false);
  };

  const handleRestorePlan = async () => {
    setLoading(true);
    const sync = await syncSubscriptionFromStripe();
    await refreshProfile();
    setLoading(false);
    if (sync.error) {
      Alert.alert('Could not sync plan', sync.error);
      return;
    }
    if (sync.plan === 'pro') {
      Alert.alert('Pro activated', 'Your subscription is active. Check the You tab.');
    } else {
      Alert.alert(
        'No active subscription',
        sync.synced
          ? 'Stripe has no active Pro subscription on this account.'
          : 'Complete checkout first, then try again.'
      );
    }
  };

  const handleManage = async () => {
    setLoading(true);
    const result = await openBillingPortal();
    setLoading(false);
    if (result.error) {
      Alert.alert('Billing portal', result.error);
      return;
    }
    if (result.success) {
      await refreshProfile();
    }
  };

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
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: C.a, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Plans
          </Text>
          <Text style={{ fontFamily: FONTS.semibold, fontSize: 30, color: C.text, letterSpacing: -1, lineHeight: 31.5 }}>
            Grow your roster.
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, letterSpacing: -0.2, marginTop: 8, lineHeight: 21 }}>
            Hosted AI is included — free tier to try, Pro when your agents earn their keep.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          {PLAN_DEFS.map(p => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={p.planKey === currentPlan}
              loading={loading}
              onUpgrade={handleUpgrade}
              onManage={handleManage}
            />
          ))}
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 14, backgroundColor: C.c1, borderWidth: 1, borderColor: stripeStatus.ok ? 'rgba(163,230,53,0.25)' : C.border, borderRadius: C.radius }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textDim, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            Stripe status
          </Text>
          {stripeStatus.loading ? (
            <ActivityIndicator color={C.a} size="small" />
          ) : (
            Object.entries(stripeStatus.checks).map(([key, check]) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={{ color: check.ok ? C.a : '#f87171', fontSize: 12 }}>{check.ok ? '✓' : '✗'}</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, flex: 1 }}>{check.detail}</Text>
              </View>
            ))
          )}
          {!stripeStatus.loading && !stripeStatus.ok && (
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: '#fbbf24', marginTop: 8, lineHeight: 18 }}>
              Fix items in docs/STRIPE_SETUP.md, then reopen this screen.
            </Text>
          )}
          {currentPlan !== 'pro' && (
            <TouchableOpacity onPress={handleRestorePlan} disabled={loading} style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.a }}>Restore plan from Stripe</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ marginHorizontal: 16, marginBottom: 32, padding: 16, backgroundColor: C.c1, borderWidth: 1, borderStyle: 'dashed', borderColor: C.borderStrong, borderRadius: C.radius, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.c2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shield" size={18} color={C.a} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: C.text, letterSpacing: -0.2 }}>
              Secure checkout via Stripe
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, letterSpacing: -0.1, marginTop: 2 }}>
              Cancel anytime from Manage subscription.
            </Text>
          </View>
        </View>
      </ScrollView>
      {loading && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.a} size="large" />
        </View>
      )}
    </View>
  );
}
