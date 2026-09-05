import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Import circular com auth-api.ts (que importa apiRequest daqui): seguro porque
// getAccessToken so e chamado dentro de uma funcao, apos ambos os modulos carregarem.
import { getAccessToken } from './auth-api';

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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function parseApiErrorMessage(body: string, status: number) {
  try {
    const parsed = JSON.parse(body) as { message?: unknown };

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }

    if (Array.isArray(parsed.message)) {
      const messages = parsed.message.filter(
        (message): message is string => typeof message === 'string' && Boolean(message.trim()),
      );
      if (messages.length > 0) return messages.join('\n');
    }
  } catch {
    // Respostas fora do contrato nao sao exibidas para evitar vazar detalhes internos.
  }

  return `A API recusou a alteracao com o status HTTP ${status}.`;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;

  return 'Nao foi possivel conectar a API. Verifique sua conexao e se o servidor esta disponivel.';
}

function getAuthHeader(): Record<string, string> {
  const token = getAccessToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(parseApiErrorMessage(body, response.status), response.status);
  }

  return response.json() as Promise<T>;
}
