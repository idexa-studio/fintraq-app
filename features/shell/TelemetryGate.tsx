import { usePro } from '@/features/pro';
import { useSettings } from '@/features/settings';
import { Analytics, Crashlytics, screenNameFromSegments } from '@/platform/telemetry';
import { useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Wires Firebase Analytics and Crashlytics to app state: the user's "Share usage data" choice,
 * one screen_view per route template, and a few device-level user properties. Nothing is sent
 * until settings have loaded, so an opted-out user never reports a single event on launch.
 */
export function TelemetryGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useSettings();
  const { isPro } = usePro();
  const { i18n } = useTranslation();
  const segments = useSegments();
  const allowed = !isLoading && profile.shareUsageData;

  useEffect(() => {
    if (isLoading) return;
    Analytics.setEnabled(profile.shareUsageData);
    Crashlytics.setEnabled(profile.shareUsageData);
  }, [isLoading, profile.shareUsageData]);

  useEffect(() => {
    if (!allowed) return;
    Analytics.setUserProperties({
      is_pro: isPro ? 'true' : 'false',
      app_language: i18n.language,
      default_currency: profile.defaultCurrency,
    });
  }, [allowed, isPro, i18n.language, profile.defaultCurrency]);

  const screenName = screenNameFromSegments(segments);
  const lastScreen = useRef<string | null>(null);
  useEffect(() => {
    if (!allowed || lastScreen.current === screenName) return;
    lastScreen.current = screenName;
    Analytics.screen(screenName);
  }, [allowed, screenName]);

  return <>{children}</>;
}
