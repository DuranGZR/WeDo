type LogContext = Record<string, unknown>;
export const logger = {
  info(message: string, context?: LogContext) {
    if (__DEV__) console.info(`[WeDo] ${message}`, context);
  },
  warn(message: string, context?: LogContext) {
    console.warn(`[WeDo] ${message}`, context);
  },
  error(message: string, error?: unknown, context?: LogContext) {
    console.error(`[WeDo] ${message}`, error, context);
  },
};
