import { Divider } from '@digdir/designsystemet-react';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import DeactivateAccountForm from './DeactivateAccountForm';
import styles from './ProfileForms.module.scss';

export default async function Profile() {
  const [authInfo] = await Promise.all([cachedAuthInfo()]);
  const currentEmail = authInfo?.bruker?.email ?? '';

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.profileContent}>
          <div className={styles.profileList}>
            <ChangeEmailForm currentEmail={currentEmail} />
            <ChangePasswordForm />
          </div>
          <Divider />
          <DeactivateAccountForm />
        </div>
      </div>
    </div>
  );
}
