import { apiRequest } from './client';
import type {
  AuthUserSummary,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  SignupRequest,
  TokenBundle,
  ValidateRequest,
  ValidateResponse,
} from '../types/auth';

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

export function validate(payload: ValidateRequest): Promise<ValidateResponse> {
  return apiRequest<ValidateResponse>('/api/v1/auth/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(token: string): Promise<AuthUserSummary> {
  return apiRequest<AuthUserSummary>('/api/v1/auth/me', {
    method: 'GET',
    token,
  });
}
