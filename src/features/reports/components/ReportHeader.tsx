import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, ThemeContextType } from '../../../providers/ThemeProvider';

interface ReportHeaderProps {
  title: string;
}

export const ReportHeader = React.memo(function ReportHeader({ title }: ReportHeaderProps) {
  const theme = useTheme();
  const { colors } = theme;
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = useCallback(() => router.back(), [router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius , layout }: ThemeContextType) => StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing('3'),
    paddingBottom: spacing('6'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('4'),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
});
