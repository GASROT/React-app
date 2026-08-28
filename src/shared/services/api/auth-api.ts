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

let accessToken: string | null = null;
let currentUser: LoginResponse['user'] | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export async function login(email: string, password: string) {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  accessToken = response.tokens.accessToken;
  currentUser = response.user;

  return response;
}

