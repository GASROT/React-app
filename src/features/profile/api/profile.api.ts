import { apiRequest } from '@/shared/services/api/api-client';

export type ProfileAddress = {
  id: string;
  cep: string;
  street: string;
  city: string;
  uf: string;
};

export type TechnicalResponsible = {
  cpfMasked: string;
  crea: string;
};

export type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileType: string;
  documentMasked: string;
  emailVerified: boolean;
  pushNotificationsEnabled: boolean;
  biometricsEnabled: boolean;
  lgpdConsent: boolean;
  agronomistResponsible: TechnicalResponsible | null;
  addresses: ProfileAddress[];
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
};

export type AddressPayload = Omit<ProfileAddress, 'id'>;

export function getProfile() {
  return apiRequest<ProfileResponse>('/profile');
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiRequest<ProfileResponse>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function addAddress(payload: AddressPayload) {
  return apiRequest<ProfileAddress[]>('/profile/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeAddress(id: string) {
  return apiRequest<ProfileAddress[]>(`/profile/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function updateBiometrics(enabled: boolean) {
  return apiRequest<ProfileResponse>('/profile/biometrics', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export function updateTechnicalResponsible(payload: { cpf: string; crea: string }) {
  return apiRequest<ProfileResponse>('/profile/technical-responsible', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateLgpdConsent(consent: boolean) {
  return apiRequest<ProfileResponse>('/profile/lgpd', {
    method: 'PATCH',
    body: JSON.stringify({ consent }),
  });
}
