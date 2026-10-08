import { Button, Card, EmptyState, Header, Screen, Text, TextField, useToast } from '@/design';
import { LoggerService } from '@/shared/logging/logger';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';

/** The app's own log, newest lines as the logger keeps them: searched, shared as a text file, or cleared. English only. */
export function LogsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState(() => LoggerService.getRawLogText());
  const [find, setFind] = useState('');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const shown = useMemo(() => {
    const needle = find.trim().toLowerCase();
    return needle ? text.split('\n').filter((line) => line.toLowerCase().includes(needle)).join('\n') : text;
  }, [text, find]);

  const share = async () => {
    if (!(await LoggerService.shareLogs())) toast.show({ message: 'The log could not be shared' });
  };
  const clear = () => {
    LoggerService.clearLogs();
    setText(LoggerService.getRawLogText());
  };

  return (
    <Screen
      scrollHidesKeyboard
      header={<Header title="Log" onBack={back} />}
      footer={
        <>
          <Button label="Share as a text file" disabled={!text} onPress={share} />
          <Button label="Clear the log" variant="secondary" disabled={!text} onPress={clear} />
        </>
      }
    >
      <TextField icon="search" value={find} onChangeText={setFind} placeholder="Find in the log" accessibilityLabel="Find in the log" autoCorrect={false} autoCapitalize="none" onClear={() => setFind('')} />
      {!text ? (
        <EmptyState icon="file-text" title="Nothing logged yet" body="Lines appear here as the app runs." />
      ) : !shown ? (
        <EmptyState icon="search" title={`Nothing matches “${find.trim()}”`} />
      ) : (
        <Card>
          <Text variant="caption" selectable>{shown}</Text>
        </Card>
      )}
    </Screen>
  );
}
