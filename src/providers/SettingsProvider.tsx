import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NotificationService } from '../services/notification.service';
import { StorageKeys } from '../constants/keys';
import { LoggerService } from '@/src/services/logger.service';

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  defaultCurrency: string;
  theme: 'system' | 'light' | 'dark';
  reminderEnabled: boolean;
  reminderTime: string; // e.g. "20:00"
};

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

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  defaultCurrency: 'USD',
  theme: 'system',
  reminderEnabled: false,
  reminderTime: '20:00',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(StorageKeys.PROFILE);
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        LoggerService.error('SETTINGS', 'Failed to load profile settings', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  /**
   * Sync logic: Automatically handles hardware scheduling when JS state changes.
   */
  useEffect(() => {
    if (isLoading) return;

    const syncNotifications = async () => {
      if (profile.reminderEnabled) {
        const granted = await NotificationService.requestPermissions();
        if (granted) {
          await NotificationService.scheduleDailyReminder(profile.reminderTime);
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync('daily_reminder').catch(() => {});
      }
    };

    syncNotifications();
  }, [profile.reminderEnabled, profile.reminderTime, isLoading]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const newProfile = { ...profile, ...updates };
      await AsyncStorage.setItem(StorageKeys.PROFILE, JSON.stringify(newProfile));
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
