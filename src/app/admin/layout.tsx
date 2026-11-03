import { notFound } from 'next/navigation';
import { LoginRequired } from '~/features/login';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <LoginRequired />;
  }
  if (authInfo.type !== 'Enhet') {
    notFound();
  }

  return <>{children}</>;
}
