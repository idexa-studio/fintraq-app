import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { getFormattedAppVersion } from '@/src/utils/version';

const DEVELOPER_TAPS = 10;

/** App name and version. Tapping it ten times opens the developer tools. */
export const SettingsFooter = React.memo(function SettingsFooter() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const router = useRouter();
  const taps = useRef(0);

  const onPress = useCallback(() => {
    taps.current += 1;
    if (taps.current >= DEVELOPER_TAPS) {
      taps.current = 0;
      router.push('/developer');
    }
  }, [router]);

  return (
    <Pressable onPress={onPress} accessibilityRole="text" hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }} style={[styles.footer, { gap: spacing('1'), paddingVertical: spacing('4') }]}>
      <Text variant="label" tone="muted">
        Fintraq / Core
      </Text>
      <Text variant="caption" tone="muted">
        {t('settings.footer', { version: getFormattedAppVersion() })}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({ footer: { alignItems: 'center' } });
