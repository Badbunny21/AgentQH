import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { C, FONTS } from '../constants/theme';
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
    title: 'Your agents,\nyour setup',
    body: 'Keep each imported agent recognizable with its name, role and details.',
  },
  {
    eyebrow: '03 / VISIBLE',
    title: "See what's\ngetting done",
    body: 'See recorded tasks and reports in one place. A connection or stored status is not proof that work is running.',
  },
  {
    eyebrow: '04 / REMEMBERED',
    title: 'Memory that\nactually sticks',
    body: 'Keep saved context alongside each agent. What an agent uses depends on its own setup and connection.',
  },
];

function SlideHero({ idx }: { idx: number }) {
  const labels = ['Your imported agents', 'Agent details', 'Tasks and reports', 'Saved context'];
  const icons = ['plus', 'user', 'check', 'brain'] as const;
  return (
    <View style={{ width: '100%', borderRadius: 20, padding: 24, backgroundColor: C.c1, borderWidth: 1, borderColor: C.border }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: C.textMuted, letterSpacing: 1.5, marginBottom: 20 }}>ILLUSTRATION</Text>
      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: C.c2, justifyContent: 'center', alignItems: 'center', marginBottom: 18 }}>
        <Icon name={icons[idx]} size={28} color={C.a} />
      </View>
      <Text style={{ fontFamily: FONTS.semibold, fontSize: 19, color: C.text }}>{labels[idx]}</Text>
      <View style={{ height: 8, width: '70%', backgroundColor: C.c3, borderRadius: 4, marginTop: 16 }} />
      <View style={{ height: 8, width: '45%', backgroundColor: C.c3, borderRadius: 4, marginTop: 8 }} />
      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textDim, marginTop: 20 }}>Your account starts empty. Import your own agent.</Text>
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
