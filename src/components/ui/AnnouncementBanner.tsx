import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  message: string;
  canDismiss: boolean;
  onDismiss: () => void;
};

export const AnnouncementBanner = React.memo(function AnnouncementBanner({
  message,
  canDismiss,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, pointerEvents: 'box-none' }]}>
      <View style={[styles.banner, { backgroundColor: colors.primary }]}>
        <Text style={styles.message} numberOfLines={3}>{message}</Text>
        {canDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={8} style={styles.dismissButton}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

function createStyles({ spacing, radius, typography, colors }: ThemeContextType) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      paddingHorizontal: spacing('4'),
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      borderRadius: radius('lg'),
      gap: spacing('3'),
    },
    message: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.background,
      lineHeight: 17,
    },
    dismissButton: {
      padding: spacing('1'),
    },
  });
}
