import * as analytics from '@react-native-firebase/analytics';
import * as crashlytics from '@react-native-firebase/crashlytics';
import type { FirebaseModules } from './firebase-modules';

const modules: FirebaseModules = { analytics, crashlytics };

/** The native Firebase modules (iOS and Android). The web build resolves firebase-modules.ts instead. */
export function getFirebaseModules(): Promise<FirebaseModules | null> {
  return Promise.resolve(modules);
}
