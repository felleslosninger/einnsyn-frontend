import { AdminHeaderRow } from '~/features/admin';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

// The 404 for anonymous visitors comes from the main slot's admin/layout.tsx.
// A notFound() here would need its own boundary in this slot to keep the header.
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
