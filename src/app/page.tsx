import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';
import OrganizationDoesNotExist from '~/features/admin/OrganizationDoesNotExist';
import { logger } from '~/lib/utils/logger';
import ApiKeys from '../features/admin/api-keys/ApiKeys';

export default async function Root() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return <ApiKeyLogin />;
  }

  const apiClient = await cachedApiClient();
  const enhetId = authInfo.orgnummer ? authInfo.orgnummer : '';
  const apiKeys = await apiClient.enhet.listApiKey(enhetId).catch((error) => {
    logger.warn('Failed to fetch API keys for enhet', {
      error: error instanceof Error ? error.message : String(error),
      enhetId,
    });
    return null;
  });

  if (!apiKeys) {
    return <OrganizationDoesNotExist />;
  }

  return <>{apiKeys && <ApiKeys apiKeys={apiKeys} />}</>;
}
