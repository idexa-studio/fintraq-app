import { OptionCard } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export type CloudBackupChoice = 'enable' | 'skip';

type CloudBackupStepProps = {
  selectedChoice: CloudBackupChoice;
  onSelectChoice: (choice: CloudBackupChoice) => void;
  userEmail?: string | null;
  isConnecting?: boolean;
};

export const CloudBackupStep = React.memo(function CloudBackupStep({
  selectedChoice,
  onSelectChoice,
  userEmail,
  isConnecting,
}: CloudBackupStepProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const cloudDescription = isConnecting
    ? t('onboarding.connecting')
    : userEmail
      ? t('onboarding.connected', { email: userEmail })
      : t('onboarding.cloudDescription');

  return (
    <View style={{ gap: spacing('3') }}>
      <OptionCard
        icon="cloud-arrow-up"
        title={t('onboarding.cloudTitle')}
        description={cloudDescription}
        badge={t('onboarding.recommended')}
        selected={selectedChoice === 'enable'}
        busy={isConnecting}
        onPress={() => onSelectChoice('enable')}
      />
      <OptionCard
        icon="lock-key"
        title={t('onboarding.offlineTitle')}
        description={t('onboarding.offlineDescription')}
        selected={selectedChoice === 'skip'}
        onPress={() => onSelectChoice('skip')}
      />
    </View>
  );
});
