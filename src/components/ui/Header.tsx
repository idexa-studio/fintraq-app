import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../providers/ThemeProvider';

export type HeaderProps = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

/**
 * Header - Editorial Brutalist Design
 * 
 * Layout:
 * - Screen padding: 24px
 * - Top padding: 12px
 * - Bottom padding: 16px
 * - Gap between elements: 16px
 * 
 * Back button:
 * - Size: 44px (touch target)
 * - Radius: 12px (md)
 */
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
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
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

const createStyles = ({ colors, typography, spacing, layout }: ThemeContextType) => StyleSheet.create({
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
    fontFamily: typography.fonts.heading,
    color: colors.text,
    fontSize: typography.sizes.xxl,
    lineHeight: 26,
  },
  rightActionWrap: {
    justifyContent: 'center',
  },
});
