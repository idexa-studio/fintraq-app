import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ToolsIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Button } from '@/src/components/ui/Button';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
};

export const MaintenanceScreen = React.memo(function MaintenanceScreen({
  message,
  onRetry,
  isRetrying,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.graphicContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner}>
              <HugeiconsIcon icon={ToolsIcon} size={32} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>Under maintenance</Text>
          <Text style={styles.subtitle}>{message}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isRetrying ? 'Checking...' : 'Check again'}
            onPress={onRetry}
            variant="secondary"
            size="lg"
            disabled={isRetrying}
          />
        </View>
      </View>
    </SafeAreaView>
  );
});

function createStyles({ spacing, radius, typography, colors }: ThemeContextType) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: spacing('8'),
      paddingVertical: spacing('10'),
    },
    graphicContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing('4'),
    },
    pulseOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary + '0B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pulseInner: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary + '18',
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: spacing('3'),
      paddingHorizontal: spacing('2'),
      paddingTop: spacing('2'),
    },
    title: {
      fontFamily: typography.styles.emptyTitle.fontFamily,
      fontSize: 20,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      opacity: 0.85,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: spacing('2'),
    },
  });
}
