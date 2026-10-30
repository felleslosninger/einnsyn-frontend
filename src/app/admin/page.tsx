import type { Metadata } from 'next';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  // The header's heading; the page itself is empty
  const name = (await cachedAuthInfo())?.enhet?.navn;
  return name ? { title: name } : {};
}

export default function AdminPage() {
  return <></>;
}
