import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { Header } from '@/src/components/ui/Header';
import { Input } from '@/src/components/ui/Input';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { LoggerService } from '@/src/services/logger.service';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppLogsScreen = React.memo(function AppLogsScreen() {
  const theme = useTheme();
  const { spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [rawLogText, setRawLogText] = useState<string>('');
  const [logSearch, setLogSearch] = useState('');
  const [logCount, setLogCount] = useState(0);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback(
    (config: {
      title: string;
      message?: string;
      type?: 'info' | 'success' | 'error' | 'warning';
      buttons?: AlertButton[];
    }) => {
      setAlertConfig({
        visible: true,
        title: config.title,
        message: config.message,
        type: config.type || 'info',
        buttons: config.buttons || [{ text: 'OK' }],
      });
    },
    [],
  );

  const fetchLogs = useCallback(async () => {
    const text = await LoggerService.getRawLogText();
    setRawLogText(text);
    const lineCount = text === '[SYSTEM] No log records found in the last 7 days.' ? 0 : text.split('\n').length;
    setLogCount(lineCount);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    await LoggerService.clearLogs();
    await fetchLogs();
    showAlert({
      title: 'Logs Cleared',
      message: 'All system logs have been cleared.',
      type: 'success',
    });
  };

  const handleShareLogs = async () => {
    const success = await LoggerService.shareLogs();
    if (!success) {
      showAlert({
        title: 'Export Failed',
        message: 'Could not export plain text log file.',
        type: 'error',
      });
    }
  };

  const displayContent = useMemo(() => {
    if (!logSearch.trim()) return rawLogText;
    const query = logSearch.toLowerCase();
    const filtered = rawLogText
      .split('\n')
      .filter((line) => line.toLowerCase().includes(query));
    return filtered.length > 0
      ? filtered.join('\n')
      : '[SYSTEM] No log records match active search query.';
  }, [rawLogText, logSearch]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <PageBackground />
      <Header title="App Log Console" showBack />

      <View style={styles.content}>
        {/* Actions bar */}
        <View style={styles.topActionsBar}>
          <Text style={styles.sectionLabel}>Raw Log Stream (fintraq_system.log)</Text>
          <View style={styles.actionsRow}>
            <Pressable onPress={fetchLogs} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionPrimary}>Refresh ({logCount})</Text>
            </Pressable>
            <Pressable onPress={handleShareLogs} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionPrimary}>Share (.txt)</Text>
            </Pressable>
            <Pressable onPress={handleClearLogs} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionDanger}>Clear</Text>
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={{ marginBottom: spacing('3') }}>
          <Input
            placeholder="Search raw log stream..."
            value={logSearch}
            onChangeText={setLogSearch}
          />
        </View>

        {/* Lightweight Raw Terminal Box */}
        <View style={styles.terminalContainer}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDots}>
              <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
              <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
              <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
              <Text style={styles.terminalTitle}>fintraq_system.log</Text>
            </View>
            <Text style={styles.terminalCounter}>Raw Plain Text</Text>
          </View>

          <ScrollView
            style={styles.terminalBody}
            showsVerticalScrollIndicator
            removeClippedSubviews
          >
            <Text selectable style={styles.rawLogText}>
              {displayContent}
            </Text>
          </ScrollView>
        </View>
      </View>

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, typography, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: spacing('4'),
    },
    topActionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing('2'),
    },
    sectionLabel: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
      alignItems: 'center',
    },
    actionPrimary: {
      fontSize: typography.sizes.xs,
      color: colors.primary,
      fontFamily: typography.fonts.medium,
    },
    actionDanger: {
      fontSize: typography.sizes.xs,
      color: colors.danger,
      fontFamily: typography.fonts.medium,
    },
    terminalContainer: {
      flex: 1,
      backgroundColor: '#0D1117',
      borderRadius: radius('2xl'),
      padding: spacing('4'),
      borderWidth: 1,
      borderColor: '#30363D',
    },
    terminalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing('2.5'),
      borderBottomWidth: 1,
      borderBottomColor: '#21262D',
      marginBottom: spacing('2.5'),
    },
    terminalDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    terminalTitle: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: '#8B949E',
      marginLeft: 6,
    },
    terminalCounter: {
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: '#8B949E',
    },
    terminalBody: {
      flex: 1,
    },
    rawLogText: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      lineHeight: 18,
      color: '#C9D1D9',
    },
  });
