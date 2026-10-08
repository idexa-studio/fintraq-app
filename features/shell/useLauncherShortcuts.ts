import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useAccounts } from '@/features/accounts';
import { hasPossibleTransfer } from '@/shared/calc/transfers';
import { LoggerService } from '@/shared/logging/logger';

type ShortcutId = 'expense' | 'income' | 'transfer' | 'loan';
type Shortcut = { id: ShortcutId; href: string; iosIcon: string; androidIcon: string };

// Same entries (and glyphs, on Android) as Home's quick actions. Android icons are drawables
// generated from app.json's expo-quick-actions `androidIcons`; iOS uses SF Symbols so they sit
// naturally beside the system's own menu items.
const SHORTCUTS: Shortcut[] = [
  { id: 'expense', href: '/add?kind=expense', iosIcon: 'symbol:arrow.up.right', androidIcon: 'shortcut_expense' },
  { id: 'income', href: '/add?kind=income', iosIcon: 'symbol:arrow.down.left', androidIcon: 'shortcut_income' },
  { id: 'transfer', href: '/add?kind=transfer', iosIcon: 'symbol:arrow.left.arrow.right', androidIcon: 'shortcut_transfer' },
  { id: 'loan', href: '/loans/new', iosIcon: 'symbol:banknote', androidIcon: 'shortcut_loan' },
];

/**
 * Long-press shortcuts on the launcher icon. Kept in step with the language and with whether a
 * transfer is possible (two compatible accounts in one currency), and routed on tap. Mount once, inside the onboarded stack,
 * so a shortcut can't skip onboarding; the app lock still covers whatever screen it opens.
 */
export function useLauncherShortcuts() {
  const { t, i18n } = useTranslation('shell');
  const { data: accounts } = useAccounts();
  const canTransfer = useMemo(() => hasPossibleTransfer(accounts ?? []), [accounts]);

  useQuickActionRouting();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const items = SHORTCUTS.filter((s) => s.id !== 'transfer' || canTransfer).map((s) => ({
      id: s.id,
      title: t(`shortcuts.${s.id}`),
      icon: Platform.OS === 'ios' ? s.iosIcon : s.androidIcon,
      params: { href: s.href },
    }));
    QuickActions.setItems(items).catch((e) => LoggerService.warn('SHORTCUTS', 'Failed to set launcher shortcuts', e));
  }, [t, i18n.language, canTransfer]);
}
