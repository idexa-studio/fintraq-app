import { Header, Screen, Spinner, useStyles } from '@/design';
import type { Theme } from '@/design';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

/** A page from the web shown inside the app: the privacy policy and the terms. */
export function WebPageScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const { t } = useTranslation('settings');
  const styles = useStyles(createStyles);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen scroll={false} padded={false} header={<Header title={title ?? ''} onBack={back} backLabel={t('web.back')} />}>
      <View style={styles.fill}>
        <WebView source={{ uri: url ?? '' }} style={styles.page} onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)} javaScriptEnabled domStorageEnabled />
        {loading ? <View style={styles.waiting}><Spinner /></View> : null}
      </View>
    </Screen>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    page: { flex: 1, backgroundColor: colors.background },
    waiting: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  });
