import AdminTabs from '~/features/admin/AdminTabs';
import { cachedAuthInfo } from '~/lib/auth/auth.server';

export default async function AdminHeaderRow() {
  const authInfo = await cachedAuthInfo();

  return (
    <>
      <h1 className="ds-heading" data-size="md">
        {authInfo?.enhet?.navn}
      </h1>
      <AdminTabs />
    </>
  );
}
