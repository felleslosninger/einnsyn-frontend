'use client';
import { Alert } from '@digdir/designsystemet-react';
import { EinLink } from '~/components/EinLink/EinLink';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import ApiKeyLogin from './api-keys/ApiKeyLogin';
import styles from './OrganizationDoesNotExist.module.scss';

export default function OrganizationDoesNotExist() {
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
          <div className={cn('text-container')}>{t('admin.apiKey.intro')}</div>
        </div>

        <Alert data-color="warning">
          Organisasjonen eksisterer ikke i einnsyn. For å opprette API nøkler,
          legg til organisasjonen i einnsyn.{' '}
          <EinLink href={`/admin/${authInfo.orgnummer}/add-organization`}>
            {t('admin.organization.addOrganization')}
          </EinLink>
        </Alert>
      </div>
      <div className="container-post" />
    </div>
  );
}
