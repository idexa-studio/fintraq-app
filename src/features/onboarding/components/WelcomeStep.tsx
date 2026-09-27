import { Card, IconAvatar, Text } from '@/src/components/ui';
import { ChartBarIcon, LightningIcon, LockKeyIcon } from '@/src/components/ui/icons';
import type { IconSource } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type ColorKey = 'primaryInk' | 'info' | 'success';

const FEATURES: { icon: IconSource; label: 'fastCapture' | 'analytics' | 'privacy'; colorKey: ColorKey }[] = [
  { icon: LightningIcon, label: 'fastCapture', colorKey: 'primaryInk' },
  { icon: ChartBarIcon, label: 'analytics', colorKey: 'info' },
  { icon: LockKeyIcon, label: 'privacy', colorKey: 'success' },
];

/** Three reasons to use Fintraq, grouped in one calm card instead of three competing ones. */
export const WelcomeStep = React.memo(function WelcomeStep() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <Card style={{ gap: spacing('5') }}>
      {FEATURES.map((f) => (
        <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('3.5') }}>
          <IconAvatar icon={f.icon} color={colors[f.colorKey]} size={44} weight="duotone" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{t(`onboardingFlow.features.${f.label}`)}</Text>
            <Text variant="callout" tone="muted">{t(`onboardingFlow.features.${f.label}Detail`)}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
});
