const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (message: string, ...optionalParams: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, ...optionalParams);
    }
  },
  info: (message: string, ...optionalParams: any[]) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...optionalParams);
    }
  },
  warn: (message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  },
  error: (message: string, error?: any, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${message}`, error, ...optionalParams);
  },
};
