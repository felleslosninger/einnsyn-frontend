'use client';
import { Alert } from '@digdir/designsystemet-react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import ApiKeyLogin from './ApiKeyLogin';
import styles from './ApiKeys.module.scss';

export type ApiKeysUnavailableReason = 'notRegistered' | 'pendingVerification';

export default function ApiKeysUnavailable({
  reason,
}: {
  reason: ApiKeysUnavailableReason;
}) {
  const { authInfo } = useSessionData();
  const t = useTranslation();

  if (!authInfo) {
    return <ApiKeyLogin />;
  }

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <h1 className="ds-heading" data-size="lg">
          {t('admin.apiKey.labelPlural')}
        </h1>

        <div className={styles.header}>
          <div className={cn(styles.intro, 'text-container')}>
            {t('admin.apiKey.intro')}
          </div>
        </div>

        {reason === 'pendingVerification' ? (
          <Alert data-color="info">
            {t('admin.apiKey.organizationPendingVerification')}
          </Alert>
        ) : (
          <Alert data-color="warning">
            {t('admin.apiKey.organizationNotRegistered')}{' '}
            <EinLink href={`/admin/${authInfo.orgnummer}/add-organization`}>
              {t('admin.organization.addOrganization')}
            </EinLink>
          </Alert>
        )}
      </div>
      <div className="container-post" />
    </div>
  );
}
