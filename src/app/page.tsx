import { notFound, redirect } from 'next/navigation';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { cachedAuthInfo } from '~/actions/authentication/auth';
import { logger } from '~/lib/utils/logger';
import ApiKeys from '../features/admin/api-keys/ApiKeys';
import { AnsattportenLogin } from '~/features/login/AnsattportenLogin';
import ApiKeyLogin from '~/features/admin/api-keys/ApiKeyLogin';

export default async function Root() {
  const authInfo = await cachedAuthInfo();
  if (!authInfo) {
    return (
      <div className="container-wrapper" >
        <div className="container-pre" />
        <div className="container">
          <ApiKeyLogin />
        </div>
        <div className="container-post" />
      </div>
    );
  }
  const apiClient = await cachedApiClient();

  const enhetId = authInfo.orgnummer ? authInfo.orgnummer : '';
  const apiKeys = await apiClient.enhet.listApiKey(enhetId).catch((error) => {
    logger.warn('Failed to fetch API keys for enhet', {
      error: error instanceof Error ? error.message : String(error),
      enhetId,
    });
    notFound();
  });
  return (
    <div className="container-wrapper" >
      <div className="container-pre" />
      <div className="container">
        <ApiKeys apiKeys={apiKeys} />
      </div>
      <div className="container-post" />
    </div>
  );
}