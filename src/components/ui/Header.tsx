import { Icon } from './Icon';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '@/src/providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

export type HeaderProps = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
};

export const Header = React.memo(function Header({
  title,
  showBack,
  rightAction,
  onBack,
}: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = useCallback(() => {
    if (onBack) { onBack(); return; }
    router.back();
  }, [router, onBack]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <BentoPressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={styles.backButton}
          >
            <Icon name="chevron-left" size={20} color={colors.text} weight="bold" />
          </BentoPressable>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        </View>
      </View>

      {rightAction && (
        <View style={styles.rightActionWrap}>
          {rightAction}
        </View>
      )}
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing('3'),
    paddingBottom: spacing('4'),
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('4'),
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.styles.screenTitle.fontFamily,
    color: colors.text,
    ...typography.metrics.xxl,
    lineHeight: 28,
  },
  rightActionWrap: {
    justifyContent: 'center',
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginLeft: -spacing('1'),
  },
});
