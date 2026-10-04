import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoBottomSheet, Card, Divider, ListItem, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type PrivacySheetProps = {
  visible: boolean;
  onClose: () => void;
  onOpenPolicy: () => void;
  shareUsageData: boolean;
  onShareUsageDataChange: (value: boolean) => void;
};

/** Everything about privacy in one place: the policy, and the choice to share anonymous usage data. */
export const PrivacySheet = React.memo(function PrivacySheet({ visible, onClose, onOpenPolicy, shareUsageData, onShareUsageDataChange }: PrivacySheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BentoBottomSheet visible={visible} onClose={onClose} enableDynamicSizing>
      <View style={styles.container}>
        <Text variant="headline">{t('settings.privacyTitle')}</Text>
        <Card variant="inset" style={styles.group}>
          <ListItem icon="shield-check" iconColor={colors.textMuted} title={t('settings.privacy')} onPress={onOpenPolicy} />
          <Divider />
          <ListItem
            icon="chart-line-data"
            iconColor={colors.textMuted}
            title={t('settings.shareUsageData')}
            subtitle={t('settings.shareUsageDataHint')}
            switchValue={shareUsageData}
            onSwitchChange={onShareUsageDataChange}
          />
        </Card>
      </View>
    </BentoBottomSheet>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: spacing('8'), gap: spacing('4') },
    group: { padding: 0, overflow: 'hidden' },
  });
