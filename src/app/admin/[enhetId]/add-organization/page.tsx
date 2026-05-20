import { cachedAuthInfo } from '~/actions/authentication/auth';
import OrganizationForm from '~/features/admin/OrganizationForm';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';

export default async function AddOrganization() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }
  return <OrganizationForm />;
}
