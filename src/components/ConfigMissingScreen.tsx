import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { C, FONTS } from '../constants/theme';

export default function ConfigMissingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.c0 }}>
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 80 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 24, color: C.text, letterSpacing: -0.8, marginBottom: 12 }}>
          Supabase not configured
        </Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textDim, lineHeight: 22, marginBottom: 24 }}>
          Copy .env.example to .env and add your Supabase project URL and anon key.
        </Text>
        <View style={{ backgroundColor: C.c1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: C.text, lineHeight: 20 }}>
            1. Create a project at supabase.com{'\n'}
            2. cp .env.example .env{'\n'}
            3. Paste URL + anon key into .env{'\n'}
            4. Run the SQL in supabase/migrations/{'\n'}
            5. Restart: npm start
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
