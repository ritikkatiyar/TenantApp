export type AuthUserSummary = {
  id: string;
  email: string;
  fullName: string;
};

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  expiresInSeconds: number;
  user: AuthUserSummary;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type ValidateRequest = {
  accessToken: string;
};

export type ValidateResponse = {
  valid: boolean;
  userId?: string | null;
  email?: string | null;
  expiresAtEpochSeconds?: number | null;
  message?: string | null;
};
