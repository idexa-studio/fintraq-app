import type { ExpoConfig } from 'expo/config';
import fs from 'node:fs';

const appJson = require('./app.json') as { expo: ExpoConfig };
const baseConfig = appJson.expo;

const androidGoogleServicesFile = fs.existsSync('./google-services.json') ? './google-services.json' : undefined;
const iosGoogleServicesFile = fs.existsSync('./GoogleService-Info.plist') ? './GoogleService-Info.plist' : undefined;

export default (): ExpoConfig => ({
  ...baseConfig,
  android: {
    ...baseConfig.android,
    ...(androidGoogleServicesFile ? { googleServicesFile: androidGoogleServicesFile } : {}),
  },
  ios: {
    ...baseConfig.ios,
    ...(iosGoogleServicesFile ? { googleServicesFile: iosGoogleServicesFile } : {}),
  },
  plugins: [
    ...(baseConfig.plugins ?? []),
    '@react-native-firebase/app',
    [
      '@react-native-firebase/analytics',
      {
        ios: {
          withoutAdIdSupport: true,
        },
      },
    ],
    '@react-native-firebase/crashlytics',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAnalytics', 'RNFBCrashlytics'],
        },
      },
    ],
  ],
});
