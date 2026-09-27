import { Screen } from '@/src/components/ui/Screen';
import { Spinner } from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

export function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onLoadStart = useCallback(() => setLoading(true), []);

  return (
    <Screen header={{ title: title ?? '', showBack: true }} variant="fixed" edges={['top']}>
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: url ?? '' }}
          style={[styles.webView, { backgroundColor: colors.background }]}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsInlineMediaPlayback
        />
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <Spinner size="lg" />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
