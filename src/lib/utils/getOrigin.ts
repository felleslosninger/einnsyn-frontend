'use server';

import { headers } from 'next/headers';

export async function getOrigin() {
  const headersList = await headers();
  // A proxy appends its host to what the client sent, so the last one is ours
  const host =
    headersList.get('x-forwarded-host')?.split(',').at(-1)?.trim() ||
    headersList.get('host');
  // Only internal hops are plain http, so any https means the public URL is
  const protocol = headersList.get('x-forwarded-proto')?.includes('https')
    ? 'https'
    : 'http';

  return `${protocol}://${host}`;
}
