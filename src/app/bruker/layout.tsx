import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function BrukerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (authInfo?.type !== 'Bruker') {
    notFound();
  }

  return <>{children}</>;
}
