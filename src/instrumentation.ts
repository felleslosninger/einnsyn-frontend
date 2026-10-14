import { registerOTel } from '@vercel/otel';

export async function register() {
  registerOTel({ serviceName: 'eInnsyn' });

  // The enhet cache reaches the API, so it only exists in the Node.js runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmEnhetList } = await import('~/lib/enhet/enhet.server');
    // Moves the cold ~20-request walk off the first user request. Jittered
    // because the replicas roll out together.
    setTimeout(warmEnhetList, Math.random() * 5_000).unref();
  }
}
