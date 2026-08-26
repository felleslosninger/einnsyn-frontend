import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/actions/authentication/auth';

export default async function BrukerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo || authInfo.type !== 'Bruker') {
    notFound();
  }

  return <>{children}</>;
}
