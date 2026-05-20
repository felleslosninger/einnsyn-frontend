import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';
import OrganizationForm from '~/features/admin/OrganizationForm';

export default async function AddOrganization() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }
  return <OrganizationForm />;
}
