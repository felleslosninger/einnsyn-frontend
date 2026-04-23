import { cachedAuthInfo } from '~/actions/authentication/auth';
import DeleteOrganizationForm from '~/features/admin/DeleteOrganizationForm';
import EditOrganizationForm from '~/features/admin/EditOrganizationForm';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';

export default async function EditOrganization() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }
  if (!authInfo.enhet) {
    return <p>Ingen enhet funnet</p>;
  }
  return (
    <>
      <EditOrganizationForm enhetId={authInfo.enhet?.id} />
      {/* <DeleteOrganizationForm enhetId={authInfo.enhet?.id} /> */}
    </>
  );
}
