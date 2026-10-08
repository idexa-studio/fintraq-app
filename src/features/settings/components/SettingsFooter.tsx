import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { getFormattedAppVersion } from '@/platform/config/version';

/** App name and version. */
export const SettingsFooter = React.memo(function SettingsFooter() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={[styles.footer, { gap: spacing('1'), paddingVertical: spacing('4') }]}>
      <Text variant="label" tone="muted">
        Fintraq / Core
      </Text>
      <Text variant="caption" tone="muted">
        {t('settings.footer', { version: getFormattedAppVersion() })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({ footer: { alignItems: 'center' } });
