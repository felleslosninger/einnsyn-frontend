import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';
import DeleteOrganizationForm from '~/features/admin/DeleteOrganizationForm';
import OrganizationForm from '~/features/admin/OrganizationForm';

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
      <OrganizationForm enhet={authInfo.enhet} />
      <DeleteOrganizationForm enhet={authInfo.enhet} />
    </>
  );
}
