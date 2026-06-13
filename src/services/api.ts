import { create } from 'axios';
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import { getAppVersion, getAppBuildNumber } from '@/src/utils/version';

const BASE_URL = 'https://keeep.idexa.app';

// Create a configured Axios instance
export const api = create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: useful for logging or dynamic header injection
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamic metadata collection via expo-localization
    const locales = Localization.getLocales?.() || [];
    const calendars = Localization.getCalendars?.() || [];
    
    const country = locales[0]?.regionCode || 'US';
    const locale = locales[0]?.languageTag || 'en-US';
    const timezone = calendars[0]?.timeZone || 'UTC';
    
    // Inject centralized request headers
    config.headers['X-App-Name'] = 'Keeep';
    config.headers['X-App-Platform'] = Platform.OS;
    config.headers['X-App-Build-Number'] = String(getAppBuildNumber());
    config.headers['X-App-Version'] = getAppVersion();
    config.headers['X-App-Country'] = country;
    config.headers['X-App-Timezone'] = timezone;
    config.headers['X-App-Locale'] = locale;
    config.headers['X-App-Current-Time'] = new Date().toISOString();

    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: logs responses and normalizes response structures or handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error(`[API Response Error] from ${error.config?.url}:`, error.message);
    
    // Normalize errors to return a unified interface or custom API error
    const normalizedError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(normalizedError);
  }
);
