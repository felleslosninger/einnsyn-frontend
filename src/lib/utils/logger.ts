import { trace } from '@opentelemetry/api';

export type LogEntry = {
  '@timestamp': string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  message: string;
  traceId?: string;
  spanId?: string;
  error_message?: string;
  stack_trace?: string;
  [key: string]: unknown;
};

export type Metadata = {
  [key: string]: unknown;
};

class Logger {
  private metadata: Metadata = {};

  constructor(metadata: Metadata = {}) {
    this.metadata = metadata;
  }

  private getTraceContext() {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return {};
  }

  private log(
    level: LogEntry['level'],
    messageParam: string | Error,
    errorParam?: Error | unknown,
  ) {
    const message =
      messageParam instanceof Error ? messageParam.message : messageParam;
    const error = messageParam instanceof Error ? messageParam : errorParam;

    const entry: LogEntry = {
      '@timestamp': new Date().toISOString(),
      level,
      message,
      ...this.getTraceContext(),
      ...this.metadata,
    };

    // Add error information if provided
    if (error) {
      if (error instanceof Error) {
        entry.error_message = error.message;
        entry.stack_trace = error.stack;
      }
    }

    // In development, also log to console for easier debugging
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod =
        level === 'error'
          ? 'error'
          : level === 'warn'
            ? 'warn'
            : level === 'debug'
              ? 'debug'
              : 'log';
      console[consoleMethod](JSON.stringify(entry, null, 2));
    } else {
      // In production, log as JSON to stdout
      console.log(JSON.stringify(entry));
    }
  }

  trace(message: string | Error, error?: Error | unknown) {
    this.log('trace', message, error);
  }

  debug(message: string | Error, error?: Error | unknown) {
    this.log('debug', message, error);
  }

  info(message: string | Error, error?: Error | unknown) {
    this.log('info', message, error);
  }

  warn(message: string | Error, error?: Error | unknown) {
    this.log('warn', message, error);
  }

  error(message: string | Error, error?: Error | unknown) {
    this.log('error', message, error);
  }
}

export const logger = new Logger({
  application: 'eInnsyn',
  environment: process ? process.env.ENVIRONMENT || 'local' : 'development',
  logtype: 'application',
});

export { Logger };
