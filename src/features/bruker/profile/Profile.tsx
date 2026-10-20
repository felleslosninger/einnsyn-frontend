import { Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import DeleteAccountForm from './DeleteAccountForm';
import styles from './ProfileForms.module.scss';

export default async function Profile() {
  const [authInfo, t] = await Promise.all([cachedAuthInfo(), getTranslator()]);
  const currentEmail = authInfo?.bruker?.email ?? '';

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.profileContent}>
          <Heading level={2} className="ds-heading" data-size="md">
            {t('bruker.profile')}
          </Heading>
          <Paragraph>{t('bruker.profilePage.description')}</Paragraph>
          <Heading level={3} className="ds-heading" data-size="xs">
            {t('bruker.profilePage.login')}
          </Heading>
          <Card>
            <ChangeEmailForm currentEmail={currentEmail} />
            <ChangePasswordForm />
          </Card>
          <Heading level={3} className="ds-heading" data-size="xs">
            {t('bruker.profilePage.deleteAccount')}
          </Heading>
          <Card>
            <DeleteAccountForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
