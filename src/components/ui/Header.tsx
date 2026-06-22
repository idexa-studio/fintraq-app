import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';
import { BentoPressable } from './BentoPressable';

export type HeaderProps = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

export const Header = React.memo(function Header({
  title,
  showBack,
  rightAction
}: HeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <BentoPressable
            onPress={handleBack}
            style={styles.backButton}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.text} />
          </BentoPressable>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
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
    fontSize: typography.sizes.xxl,
    lineHeight: 28,
  },
  rightActionWrap: {
    justifyContent: 'center',
  },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radius('lg'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginLeft: -spacing('1'),
  },
});
