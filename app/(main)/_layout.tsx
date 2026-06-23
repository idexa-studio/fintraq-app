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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="accounts/form" />
        <Stack.Screen name="categories/form" />
        <Stack.Screen name="persons/form" />
        <Stack.Screen name="persons/[id]" />
        <Stack.Screen name="loans" />
        <Stack.Screen name="loans/form" />
        <Stack.Screen name="loans/[id]" />
      </Stack>
    </ErrorBoundary>
  );
}
