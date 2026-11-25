import assert from 'node:assert/strict';
import { test } from 'node:test';
import nextConfig from '../../next.config';

test('every page gets the security headers', async () => {
  assert.deepEqual(await nextConfig.headers?.(), [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ]);
});
