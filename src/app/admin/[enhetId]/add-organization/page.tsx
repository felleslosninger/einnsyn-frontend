import { cachedAuthInfo } from '~/actions/authentication/auth';
import AddOrganizationForm from '~/features/admin/AddOrganizationForm';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';

export default async function AddOrganization() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }
  return <AddOrganizationForm />;
}
