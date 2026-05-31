import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { TasksProvider } from './src/contexts/TasksContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { AgentsProvider } from './src/contexts/AgentsContext';
import { WorkspacesProvider } from './src/contexts/WorkspacesContext';
import RootNavigator from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ───────────────────────────────────────────
interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#06070a' }}>
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: '#f87171', fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            App crashed
          </Text>
          <Text style={{ color: '#f5f5f7', fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            {error.message}
          </Text>
          <View style={{ backgroundColor: '#0d0f15', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: 'rgba(245,245,247,0.62)', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 }}>
              {error.stack}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}
// ──────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#06070a' }} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#06070a' }}>
          <StatusBar style="light" />
          <AuthProvider>
            <AgentsProvider>
              <WorkspacesProvider>
                <TasksProvider>
                  <ErrorBoundary>
                    <RootNavigator />
                  </ErrorBoundary>
                </TasksProvider>
              </WorkspacesProvider>
            </AgentsProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
