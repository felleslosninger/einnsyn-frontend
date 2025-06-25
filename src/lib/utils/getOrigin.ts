'use server';

import { headers } from 'next/headers';

export async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';

  return `${protocol}://${host}`;
}
