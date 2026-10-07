import { AdminHeaderRow } from '~/features/admin';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function AdminHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return null;
  }

  return (
    <>
      <AdminHeaderRow />
      {children}
    </>
  );
}
