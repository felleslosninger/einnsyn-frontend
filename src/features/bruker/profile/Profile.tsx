import { Divider, Heading } from '@digdir/designsystemet-react';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.actions';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import DeactivateAccountForm from './DeactivateAccountForm';
import styles from './ProfileForms.module.scss';

export default async function Profile() {
  const [authInfo, t] = await Promise.all([cachedAuthInfo(), getTranslator()]);
  const currentEmail = authInfo?.bruker?.email ?? '';

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <Heading level={2} className="ds-heading" data-size="sm">
          {t('bruker.profile')}
        </Heading>
        <div className={styles.profileList}>
          <ChangeEmailForm currentEmail={currentEmail} />
          <ChangePasswordForm />
        </div>
        <Divider />
        <DeactivateAccountForm />
      </div>
    </div>
  );
}
