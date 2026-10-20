import { Divider, Heading } from '@digdir/designsystemet-react';
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
          <Heading level={2} className="ds-heading" data-size="sm">
            {t('bruker.profile')}
          </Heading>
          <div className={styles.profileList}>
            <ChangeEmailForm currentEmail={currentEmail} />
            <ChangePasswordForm />
          </div>
          <Divider />
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
}
