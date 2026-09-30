import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    notFound();
  }

  return children;
}
