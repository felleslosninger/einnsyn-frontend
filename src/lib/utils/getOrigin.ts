'use server';

import { headers } from 'next/headers';

const first = (value: string | null) => value?.split(',')[0]?.trim();

export async function getOrigin() {
  const headersList = await headers();
  const host =
    first(headersList.get('x-forwarded-host')) || headersList.get('host');
  const protocol = first(headersList.get('x-forwarded-proto')) || 'http';

  return `${protocol}://${host}`;
}
