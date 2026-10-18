import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { C, FONTS } from '../constants/theme';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import MigrationScreen from '../screens/MigrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InboxScreen from '../screens/InboxScreen';
import TasksScreen from '../screens/TasksScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AiSpendScreen from '../screens/AiSpendScreen';
import AgentChatScreen from '../screens/AgentChatScreen';
import AgentProfileScreen from '../screens/AgentProfileScreen';
import MemoryScreen from '../screens/MemoryScreen';
import AddAgentScreen from '../screens/AddAgentScreen';
import ImportTelegramScreen from '../screens/ImportTelegramScreen';
import ImportDiscordScreen from '../screens/ImportDiscordScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditAgentScreen from '../screens/EditAgentScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ConnectedPlatformsScreen from '../screens/ConnectedPlatformsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CollaborateScreen from '../screens/CollaborateScreen';
import WorkspacesScreen from '../screens/WorkspacesScreen';
import EditPlatformConnectionScreen from '../screens/EditPlatformConnectionScreen';
import CustomTabBar from './CustomTabBar';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
  SignUp: undefined;
  Migration: undefined;
  Main: undefined;
  AgentProfile: { agentId: string };
  AgentChat: { agentId: string };
  AiSpend: undefined;
  Memory: undefined;
  AddAgent: undefined;
  ImportTelegram: { fromOnboarding?: boolean } | undefined;
  ImportDiscord: { fromOnboarding?: boolean } | undefined;
  EditProfile: undefined;
  EditAgent: { agentId: string };
  Settings: { section?: 'notifications' | 'privacy' | 'help' } | undefined;
  ConnectedPlatforms: undefined;
  Notifications: undefined;
  Collaborate: undefined;
  Workspaces: undefined;
  EditPlatformConnection: { agentId: string };
};

export type TabParamList = {
  Home: undefined;
  Inbox: undefined;
  Tasks: undefined;
  You: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="You" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, profile, isLoading, profileError, refreshProfile, signOut } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session && (profileError || !profile)) {
    return (
      <View style={{ flex: 1, backgroundColor: C.c0, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 20, color: C.text }}>Could not load your profile</Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textDim, textAlign: 'center' }}>Retry before opening your account. No setup changes have been made.</Text>
        <TouchableOpacity onPress={() => void refreshProfile()}><Text style={{ color: C.a, fontFamily: FONTS.semibold }}>Retry</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => void signOut()}><Text style={{ color: C.textDim, fontFamily: FONTS.regular }}>Sign out</Text></TouchableOpacity>
      </View>
    );
  }

  const isAuthenticated = !!session;
  const needsOnboarding = isAuthenticated && !profile?.onboarding_complete;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} initialParams={{ mode: 'signin' }} />
            <Stack.Screen name="SignUp" component={AuthScreen} />
          </>
        ) : needsOnboarding ? (
          <>
            <Stack.Screen name="Migration" component={MigrationScreen} />
            <Stack.Screen name="ImportTelegram" component={ImportTelegramScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ImportDiscord" component={ImportDiscordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AiSpend" component={AiSpendScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AgentChat" component={AgentChatScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AgentProfile" component={AgentProfileScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="AiSpend" component={AiSpendScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AgentChat" component={AgentChatScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AgentProfile" component={AgentProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Memory" component={MemoryScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AddAgent" component={AddAgentScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ImportTelegram" component={ImportTelegramScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ImportDiscord" component={ImportDiscordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditAgent" component={EditAgentScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ConnectedPlatforms" component={ConnectedPlatformsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Collaborate" component={CollaborateScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Workspaces" component={WorkspacesScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditPlatformConnection" component={EditPlatformConnectionScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
