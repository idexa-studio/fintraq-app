import { Screen } from '@/src/components/ui/Screen';
import { AlertButton, AlertDialog } from '@/src/components/ui/AlertDialog';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Input } from '@/src/components/ui/Input';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { LoggerService } from '@/src/services/logger.service';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

export const AppLogsScreen = React.memo(function AppLogsScreen() {
  const theme = useTheme();
  const { spacing, colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [rawLogText, setRawLogText] = useState<string>('');
  const [logSearch, setLogSearch] = useState('');
  const [logCount, setLogCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    const lineCount = text === 'No log records found.' ? 0 : text.split('\n').length;
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
      message: 'All system logs have been cleared successfully.',
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
    <Screen header={{ title: "App Log Console", showBack: true }} variant="fixed" edges={['top', 'bottom']}>

      <View style={styles.content}>
        {/* Actions bar */}
        <View style={styles.topActionsBar}>
          <Text style={styles.sectionLabel}>Raw Log Stream ({logCount} lines)</Text>
          <View style={styles.actionsRow}>
            <Pressable onPress={fetchLogs} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionPrimary}>Refresh</Text>
            </Pressable>
            <Pressable onPress={handleShareLogs} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionPrimary}>Export (.txt)</Text>
            </Pressable>
            <Pressable onPress={() => setShowClearConfirm(true)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.actionDanger}>Clear Logs</Text>
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
              <View style={[styles.dot, { backgroundColor: colors.danger }]} />
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.terminalTitle}>fintraq.log</Text>
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

      <ConfirmDialog
        visible={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All App Logs?"
        message="This will permanently erase all stored system logs from device storage. Proceed?"
        confirmLabel="Clear Logs"
        destructive
        onConfirm={async () => {
          setShowClearConfirm(false);
          await handleClearLogs();
        }}
      />

      <AlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Screen>
  );
});

const createStyles = ({ colors, spacing, radius, typography, layout }: ThemeContextType) =>
  StyleSheet.create({
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
      ...typography.metrics.xs,
      color: colors.textMuted,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing('3'),
      alignItems: 'center',
    },
    actionPrimary: {
      ...typography.metrics.xs,
      color: colors.primaryInk,
      fontFamily: typography.fonts.medium,
    },
    actionDanger: {
      ...typography.metrics.xs,
      color: colors.danger,
      fontFamily: typography.fonts.medium,
    },
    terminalContainer: {
      flex: 1,
      backgroundColor: colors.tabBarBackground,
      borderRadius: radius('xl'),
      padding: spacing('4'),
    },
    terminalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing('2.5'),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.onInkMuted,
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
      borderRadius: radius('full'),
    },
    terminalTitle: {
      ...typography.metrics.xs,
      fontFamily: typography.fonts.mono,
      color: colors.onInkMuted,
      marginLeft: 6,
    },
    terminalCounter: {
      ...typography.metrics.xxs,
      fontFamily: typography.fonts.mono,
      color: colors.onInkMuted,
    },
    terminalBody: {
      flex: 1,
    },
    rawLogText: {
      ...typography.metrics.xs,
      fontFamily: typography.fonts.mono,
      color: colors.onInk,
    },
  });
