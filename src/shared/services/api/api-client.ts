import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

function getExpoHostApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:3000/api/v1` : null;
}

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl && (Platform.OS === 'web' || !configuredUrl.includes('localhost'))) {
    return configuredUrl;
  }

  if (Platform.OS !== 'web') {
    return getExpoHostApiUrl() ?? configuredUrl ?? DEFAULT_API_URL;
  }

  return configuredUrl ?? DEFAULT_API_URL;
}

export const apiBaseUrl = resolveApiBaseUrl();

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Falha HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
