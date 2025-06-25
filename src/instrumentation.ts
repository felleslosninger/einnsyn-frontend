import { registerOTel } from '@vercel/otel';
import { logger } from './lib/utils/logger';

export function register() {
  registerOTel({ serviceName: 'eInnsyn' });
  logger.info('OpenTelemetry instrumentation registered', {
    service: 'eInnsyn',
  });
}
