import { apiRequest } from './api-client';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profileType: 'PF' | 'PJ';
    emailVerified: boolean;
    hasAgronomistResponsible: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
    refreshExpiresInDays: number;
  };
  redirectTo: '/' | '/admin/dashboard';
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  profileType: 'PF' | 'PJ';
  document: string;
  agronomistCpf?: string;
};

let accessToken: string | null = null;
let currentUser: LoginResponse['user'] | null = null;
const listeners = new Set<() => void>();

function notifyAuthChange() {
  listeners.forEach((listener) => listener());
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function logout() {
  accessToken = null;
  currentUser = null;
  notifyAuthChange();
}

export async function login(email: string, password: string) {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  accessToken = response.tokens.accessToken;
  currentUser = response.user;
  notifyAuthChange();

  return response;
}

export async function register(payload: RegisterPayload) {
  const response = await apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  accessToken = response.tokens.accessToken;
  currentUser = response.user;
  notifyAuthChange();

  return response;
}
