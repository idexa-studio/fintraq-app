import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

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
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: typography.fonts.semibold, color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
        {error?.message}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.text }]}
        onPress={onReset}
        activeOpacity={0.75}
      >
        <Text style={[styles.buttonText, { fontFamily: typography.fonts.semibold, color: colors.background }]}>
          Try again
        </Text>
      </TouchableOpacity>
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
    fontSize: 18,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
  },
});
