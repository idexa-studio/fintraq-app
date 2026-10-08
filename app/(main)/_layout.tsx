import { Redirect, Stack } from 'expo-router'; // Refreshing layout resolution
import React from 'react';
import { SHEET_ROUTE } from '@/design';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useLauncherShortcuts } from '@/src/hooks/useLauncherShortcuts';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

export default function StackLayout() {
  const { hasOnboarded } = useOnboarding();

  if (!hasOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <ErrorBoundary>
      <LauncherShortcuts />
      <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="accounts/new" options={SHEET_ROUTE} />
        <Stack.Screen name="accounts/[id]/edit" options={SHEET_ROUTE} />
        <Stack.Screen name="categories/new" options={SHEET_ROUTE} />
        <Stack.Screen name="categories/[id]/edit" options={SHEET_ROUTE} />
        <Stack.Screen name="persons/form" />
        <Stack.Screen name="persons/[id]" />
        <Stack.Screen name="loans" />
        <Stack.Screen name="loans/form" />
        <Stack.Screen name="loans/[id]" />
        <Stack.Screen name="backup" />
        <Stack.Screen name="export" />
        <Stack.Screen name="webview" />
      </Stack>
    </ErrorBoundary>
  );
}

/** Registers and routes the launcher's long-press shortcuts; only mounted once onboarded. */
function LauncherShortcuts() {
  useLauncherShortcuts();
  return null;
}
