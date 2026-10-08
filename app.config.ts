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
    // First in the list, so it runs after expo-notifications has added the entitlement it removes.
    './plugins/with-no-push-entitlement',
    ...(config.plugins ?? []),
    '@react-native-google-signin/google-signin',
    // Firebase's iOS SDK comes through CocoaPods (the plugin's own switch). Its Swift packages are where
    // Firebase is heading, but react-native-firebase 26.4's build step for them looks for
    // GoogleService-Info.plist in ios/, and Expo keeps it in ios/Fintraq/, so that build fails at the
    // Crashlytics step (tried 2026-10-08 on Expo 57). Drop this switch, and the static linking below,
    // once a release fixes that.
    ['@react-native-firebase/app', { ios: { disableSPM: true } }],
    '@react-native-firebase/auth',
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
          // Apps built with Xcode 27 must use the scene lifecycle or iOS 27 stops them at launch.
          // Expo 58 does this by itself; remove then.
          enableSceneSupport: true,
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAnalytics', 'RNFBAuth', 'RNFBCrashlytics', 'RNFBRemoteConfig'],
        },
        android: {
          // Play Console flags release builds with no R8 obfuscation/shrinking.
          // Crashlytics' own Gradle plugin uploads the mapping file automatically,
          // so stack traces stay readable in the dashboard despite minification.
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true,
          extraProguardRules: [
            '# SoLoader & React Native JNI',
            '-keep class com.facebook.soloader.** { *; }',
            '-keepclassmembers class com.facebook.soloader.** { *; }',
            '-keep class com.facebook.react.** { *; }',
            '-keepclassmembers class * { native <methods>; }',
            '# Google Play Billing & OpenIAP',
            '-keep class com.android.billingclient.** { *; }',
            '-keep class dev.hyo.openiap.** { *; }',
            '-keep class io.github.hyochan.openiap.** { *; }',
          ].join('\n'),
        },
      },
    ],
    './plugins/with-gradle-memory',
    './plugins/with-disable-android-backup',
  ],
});
