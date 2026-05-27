import { Redirect, Stack } from 'expo-router'; // Refreshing layout resolution
import React from 'react';
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary';
import { useOnboarding } from '../../src/providers/OnboardingProvider';

export default function StackLayout() {
  const { hasOnboarded } = useOnboarding();

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="accounts/index" />
        <Stack.Screen name="accounts/form" />
        <Stack.Screen name="categories/form" />
      </Stack>
    </ErrorBoundary>
  );
}
