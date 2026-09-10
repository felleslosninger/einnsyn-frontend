import { notFound } from 'next/navigation';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import AdminTabs from '~/features/admin/AdminTabs';

/**
 * The header's second row on the admin routes: the signed-in enhet's name and
 * the admin tabs. 404s without a session — the admin area has nothing to show
 * to an anonymous visitor.
 */
export default async function AdminHeaderRow() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    notFound();
  }

  return (
    <>
      <h1 className="ds-heading" data-size="md">
        {authInfo.enhet?.navn}
      </h1>
      <AdminTabs />
    </>
  );
}
