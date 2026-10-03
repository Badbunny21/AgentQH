import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import ConfigMissingScreen from '../components/ConfigMissingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import MigrationScreen from '../screens/MigrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InboxScreen from '../screens/InboxScreen';
import TasksScreen from '../screens/TasksScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AgentProfileScreen from '../screens/AgentProfileScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import MemoryScreen from '../screens/MemoryScreen';
import AddAgentScreen from '../screens/AddAgentScreen';
import ImportTelegramScreen from '../screens/ImportTelegramScreen';
import ImportDiscordScreen from '../screens/ImportDiscordScreen';
import CostScreen from '../screens/CostScreen';
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
  Auth: { mode: 'signin' | 'signup' };
  Migration: undefined;
  Main: undefined;
  AgentProfile: { agentId: string };
  Upgrade: undefined;
  Memory: undefined;
  Costs: undefined;
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
  const { session, profile, isLoading, isConfigured } = useAuth();

  if (!isConfigured) {
    return <ConfigMissingScreen />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!session;
  const needsOnboarding = isAuthenticated && !profile?.onboarding_complete;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : needsOnboarding ? (
          <>
            <Stack.Screen name="Migration" component={MigrationScreen} />
            <Stack.Screen name="ImportTelegram" component={ImportTelegramScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ImportDiscord" component={ImportDiscordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AgentProfile" component={AgentProfileScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="AgentProfile" component={AgentProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Memory" component={MemoryScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Costs" component={CostScreen} options={{ animation: 'slide_from_right' }} />
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
