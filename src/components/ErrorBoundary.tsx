import { Text } from '@/src/components/ui/Text';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { RADIUS } from '@/src/theme/tokens';
import { Crashlytics } from '@/platform/telemetry';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { useTranslation } from 'react-i18next';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: typography.styles.emptyTitle.fontFamily, color: colors.text }]}>
        {t('ui.somethingWrong')}
      </Text>
      <Text style={[styles.message, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
        {error?.message}
      </Text>
      <BentoPressable
        style={[styles.button, { backgroundColor: colors.text }]}
        onPress={onReset}
      >
        <Text style={[styles.buttonText, { fontFamily: typography.styles.buttonLabel.fontFamily, color: colors.background }]}>
          {t('common.tryAgain')}
        </Text>
      </BentoPressable>
    </View>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  componentDidCatch(error: Error) {
    Crashlytics.recordError(error, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    ...TYPOGRAPHY.metrics.xl,
  },
  message: {
    ...TYPOGRAPHY.metrics.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.metrics.md,
  },
});
