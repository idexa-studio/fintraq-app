import { usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { configureFirebaseTelemetry, logFirebaseScreenView } from '@/src/services/firebase';
import { LoggerService } from '@/src/services/logger.service';

export const FirebaseProvider = React.memo(function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  useEffect(() => {
    const enabled = !__DEV__;
    configureFirebaseTelemetry(enabled).catch((e) => { if (__DEV__) LoggerService.warn('FIREBASE', 'Failed to configure telemetry', e); });
  }, []);

  useEffect(() => {
    if (!pathname || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    logFirebaseScreenView(pathname).catch((e) => { if (__DEV__) LoggerService.warn('FIREBASE', 'Failed to log screen view', e); });
  }, [pathname]);

  return <>{children}</>;
});
