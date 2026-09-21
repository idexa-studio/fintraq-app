import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { AppLanguage, resolveLanguage, SupportedLanguage } from '@/src/i18n';
import { useSettings } from './SettingsProvider';

type I18nContextType = {
  language: AppLanguage;
  resolvedLanguage: SupportedLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function useAppLanguage() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useAppLanguage must be used within I18nProvider');
  return context;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, isLoading } = useSettings();
  const language = profile.language ?? 'system';
  const resolvedLanguage = resolveLanguage(language);

  useEffect(() => {
    if (!isLoading) void i18n.changeLanguage(resolvedLanguage);
  }, [isLoading, resolvedLanguage]);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    await updateProfile({ language: nextLanguage });
    await i18n.changeLanguage(resolveLanguage(nextLanguage));
  }, [updateProfile]);

  const value = useMemo(() => ({ language, resolvedLanguage, setLanguage }), [language, resolvedLanguage, setLanguage]);

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
}
