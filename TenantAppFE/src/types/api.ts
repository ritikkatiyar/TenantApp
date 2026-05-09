export type ApiError = {
  status?: number;
  message?: string;
  path?: string;
  timestamp?: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
};
