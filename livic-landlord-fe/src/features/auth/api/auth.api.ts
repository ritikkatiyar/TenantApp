import { apiRequest } from '@/src/api/client';
import type {
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  SignupRequest,
  TokenBundle,
} from '@/src/types/auth';

export function login(payload: LoginRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function signup(payload: SignupRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refresh(payload: RefreshRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout(payload: LogoutRequest): Promise<void> {
  return apiRequest<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

