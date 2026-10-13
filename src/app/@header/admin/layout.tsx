import { notFound } from 'next/navigation';
import { AdminTabs } from '~/features/admin';
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

  return (
    <>
      <h1 className="ds-heading" data-size="md">
        {authInfo?.enhet?.navn}
      </h1>
      <AdminTabs />
    </>
  );
}
