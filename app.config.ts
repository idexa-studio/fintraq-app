import type { ConfigContext, ExpoConfig } from 'expo/config';
import fs from 'node:fs';

const androidGoogleServicesFile = fs.existsSync('./google-services.json') ? './google-services.json' : undefined;
const iosGoogleServicesFile = fs.existsSync('./GoogleService-Info.plist') ? './GoogleService-Info.plist' : undefined;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Fintraq',
  slug: config.slug ?? 'luno',
  android: {
    ...config.android,
    ...(androidGoogleServicesFile ? { googleServicesFile: androidGoogleServicesFile } : {}),
  },
  ios: {
    ...config.ios,
    ...(iosGoogleServicesFile ? { googleServicesFile: iosGoogleServicesFile } : {}),
  },
  plugins: [
    ...(config.plugins ?? []),
    '@react-native-google-signin/google-signin',
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
        android: {
          extraGradleProps: {
            'org.gradle.jvmargs': '-Xmx3072m -XX:MaxMetaspaceSize=1024m',
            'android.lint.options.checkReleaseBuilds': 'false',
            'android.lint.options.abortOnError': 'false',
          },
        },
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAnalytics', 'RNFBCrashlytics'],
        },
      },
    ],
  ],
});
