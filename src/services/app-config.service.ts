import { api, type ApiError } from '@/src/services/api';
import { getAppBuildNumber } from '@/src/utils/version';

export interface StoreLinks {
  androidStore: string;
  iosStore: string;
}

export interface AppConfigResponse {
  success: boolean;
  message: string;
  data: {
    action: 'force-update' | 'suggest-update' | 'none';
    message: string;
    links: StoreLinks;
  } | null;
  error: string | null;
}

/**
 * Fetches the app configuration from the remote server.
 */
export async function fetchAppConfig(): Promise<AppConfigResponse> {
  const buildNumber = getAppBuildNumber();

  try {
    const response = await api.get<AppConfigResponse>('/api/v1/mobile/app-config', {
      params: {
        minSuppurt: buildNumber,
      },
    });

    return response.data;
  } catch (error) {
    const apiError = error as ApiError | undefined;
    const isExpectedOfflineCase = apiError?.isNetworkError || apiError?.isTimeoutError;
    const message = error instanceof Error ? error.message : 'Network error';

    if (isExpectedOfflineCase) {
      console.warn('[AppConfigService] App config unavailable. Continuing with cached/default behavior.');
    } else {
      console.error('[AppConfigService] Error fetching app config:', error);
    }

    return {
      success: false,
      message,
      data: null,
      error: message,
    };
  }
}
