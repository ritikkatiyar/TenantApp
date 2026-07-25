export type FieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  status?: number;
  fieldErrors?: FieldError[];

  constructor(message: string, status?: number, fieldErrors?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Maps common backend error codes to user-friendly messages.
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Please log in again.';
    if (error.status === 403) return "You don't have permission to perform this action.";
    if (error.status === 404) return 'The requested resource was not found.';
    if (error.status === 500) return 'A server error occurred. Please try again later.';
    
    // Handle validation errors
    if (error.fieldErrors && error.fieldErrors.length > 0) {
      return error.fieldErrors.map(fe => fe.message).join('\n');
    }

    return error.message;
  }

  if (error.message === 'Network request failed') {
    return 'Cannot connect to the server. Please check your internet connection.';
  }

  return error.message || 'An unexpected error occurred.';
}
