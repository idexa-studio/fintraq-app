import { Button, Emblem, Message, Screen } from '@/design';
import { Crashlytics } from '@/platform/telemetry';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** What is shown in place of a screen that failed while drawing: that the records are safe, and a way to try again. */
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('shell');
  return (
    <Screen centred footer={<Button label={t('error.retry')} onPress={onRetry} />}>
      <Message illustration={<Emblem icon="warning" color="orange" />} title={t('error.title')} body={t('error.body')} />
    </Screen>
  );
}

type Props = { children: React.ReactNode };
type State = { failed: boolean };

/**
 * Catches a failure while a screen draws, so one broken screen does not take the app down with
 * it. The failure is reported; the user is told plainly and offered another go. The technical
 * message is not shown: it means nothing to them and goes to crash reporting instead.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    Crashlytics.recordError(error, 'ErrorBoundary');
  }

  retry = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? <ErrorScreen onRetry={this.retry} /> : this.props.children;
  }
}
