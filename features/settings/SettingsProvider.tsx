import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NotificationService } from '@/platform/notifications/notifications';
import { syncReminders } from '@/platform/notifications/reminder-sync';
import { DEFAULT_PROFILE, readStoredProfile, saveProfile } from '@/shared/settings/profile';
import type { UserProfile } from '@/shared/settings/profile';
import { LoggerService } from '@/shared/logging/logger';

type SettingsContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await readStoredProfile();
        if (stored) setProfile(prev => ({ ...prev, ...stored }));
      } catch (e) {
        LoggerService.error('SETTINGS', 'Failed to load profile settings', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  /**
   * Keeps OS reminders in step with the saved settings: on load, whenever reminder settings change,
   * and every time the app comes back to the foreground — which tops up the rolling window and
   * re-arms alarms as exact once the user allows it.
   */
  useEffect(() => {
    if (isLoading) return;
    const sync = async () => {
      if (profile.reminderEnabled) await NotificationService.requestPermissions();
      await syncReminders();
    };
    void sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminders();
    });
    return () => subscription.remove();
  }, [profile.reminderEnabled, profile.reminderTime, isLoading]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const newProfile = { ...profile, ...updates };
      await saveProfile(newProfile);
      setProfile(newProfile);
    } catch (e) {
      LoggerService.error('SETTINGS', 'Failed to save profile settings', e);
    }
  }, [profile]);

  const contextValue = useMemo(() => ({ profile, updateProfile, isLoading }), [profile, updateProfile, isLoading]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
