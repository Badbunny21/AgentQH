import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
import { DEMO_AGENTS } from '../constants/demoAgents';
import AgentAvatar from '../components/AgentAvatar';
import Icon from '../components/Icon';
import { PrimaryButton } from '../components/Buttons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const SLIDES = [
  {
    eyebrow: '01 / ORGANIZED',
    title: 'Your agents,\nfinally in one place',
    body: 'Stop hunting through Telegram threads, Discord servers, and lost chat tabs. Every agent you work with, on one home screen.',
  },
  {
    eyebrow: '02 / DISTINCT',
    title: 'They feel\nlike people',
    body: 'Names, faces, personalities. A roster you recognize at a glance — not a folder of identical text boxes.',
  },
  {
    eyebrow: '03 / VISIBLE',
    title: "See what's\ngetting done",
    body: 'Task boards, live status, an activity feed. Always know what your crew is working on, and what just landed.',
  },
  {
    eyebrow: '04 / REMEMBERED',
    title: 'Memory that\nactually sticks',
    body: 'Every agent remembers what it learns about you and your work. Never repeat context. Never start from zero.',
  },
];

function SlideHero({ idx }: { idx: number }) {
  if (idx === 0) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, width: '100%' }}>
        {DEMO_AGENTS.slice(0, 8).map((agent) => (
          <View key={agent.id} style={{ width: '22%', alignItems: 'center' }}>
            <AgentAvatar agent={agent} size={60} showStatus={false} />
          </View>
        ))}
      </View>
    );
  }

  if (idx === 1) {
    const trio = ['maya', 'finn', 'iris'].map(id => DEMO_AGENTS.find(a => a.id === id)!);
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', paddingHorizontal: 10 }}>
        {trio.map((agent, i) => (
          <View key={agent.id} style={{ alignItems: 'center', transform: [{ translateY: i === 1 ? -12 : 0 }] }}>
            <AgentAvatar agent={agent} size={i === 1 ? 96 : 78} showStatus={false} />
            <Text style={{ fontFamily: FONTS.semibold, fontSize: 13, color: C.text, marginTop: 10 }}>{agent.name}</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 9.5, color: C.textDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              {agent.role}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (idx === 2) {
    const sampleTasks = [
      { agent: 'kai', text: 'Thursday standup moved to 11am', done: true },
      { agent: 'finn', text: 'Auth refactor — PR up', done: true },
      { agent: 'maya', text: 'CoreWeave Q3 sweep — in progress', done: false },
    ];
    return (
      <View style={{ gap: 8, width: '100%' }}>
        {sampleTasks.map((task, i) => {
          const agent = DEMO_AGENTS.find(a => a.id === task.agent)!;
          return (
            <View
              key={i}
              style={{
                backgroundColor: C.c2,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 14,
                padding: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {task.done ? (
                <LinearGradient
                  colors={['#a3e635', '#22d3ee', '#e879f9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="check" size={11} color="#0a0a0a" strokeWidth={3} />
                </LinearGradient>
              ) : (
                <View style={{ width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, borderColor: C.borderStrong }} />
              )}
              <Text
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: task.done ? C.textDim : C.text,
                  textDecorationLine: task.done ? 'line-through' : 'none',
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {task.text}
              </Text>
              <AgentAvatar agent={agent} size={26} showStatus={false} />
            </View>
          );
        })}
      </View>
    );
  }

  // idx === 3: Memory
  const sage = DEMO_AGENTS.find(a => a.id === 'sage')!;
  const memCards = [
    'No meetings before 10am PT',
    'Voice: warm-direct, no startup-speak',
    'Saying no more this year',
  ];
  return (
    <View style={{ width: '100%', height: 210 }}>
      <View style={{ alignItems: 'center' }}>
        <AgentAvatar agent={sage} size={72} showStatus={false} />
      </View>
      {memCards.map((text, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: 96 + i * 26,
            left: 8 + i * 12,
            right: 8 + i * 12,
            backgroundColor: C.c2,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 12,
            padding: 10,
            paddingHorizontal: 14,
            transform: [{ rotate: `${(i - 1) * 1.2}deg` }],
          }}
        >
          <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.text, letterSpacing: -0.1 }}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const [idx, setIdx] = useState(0);
  const insets = useSafeAreaInsets();
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Auth', { mode: 'signup' });
    } else {
      setIdx(i => i + 1);
    }
  };

  const handleSkip = () => {
    navigation.replace('Auth', { mode: 'signup' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      <View style={{ position: 'absolute', top: insets.top + 16, right: 20, zIndex: 10 }}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textDim }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Hero area */}
      <View style={{ position: 'absolute', top: insets.top + 80, left: 32, right: 32, alignItems: 'center', justifyContent: 'center', height: 260 }}>
        <SlideHero idx={idx} />
      </View>

      {/* Text content */}
      <View style={{ position: 'absolute', left: 28, right: 28, bottom: insets.bottom + 160 }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: C.a, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
          {slide.eyebrow}
        </Text>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 34, color: C.text, letterSpacing: -1.1, lineHeight: 36, marginBottom: 16 }}>
          {slide.title}
        </Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textDim, lineHeight: 22.5, letterSpacing: -0.2 }}>
          {slide.body}
        </Text>
      </View>

      {/* Dots + Next button */}
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 48, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((_, j) => (
            <View
              key={j}
              style={{
                width: j === idx ? 22 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: j === idx ? C.a : C.c3,
              }}
            />
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton onPress={handleNext} icon="arrow" style={{ paddingHorizontal: 0, minWidth: 130 }}>
          {isLast ? 'Get started' : 'Next'}
        </PrimaryButton>
      </View>
    </View>
  );
}
