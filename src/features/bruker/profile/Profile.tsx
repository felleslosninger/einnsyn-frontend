import { cachedAuthInfo } from '~/actions/authentication/auth';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import DeactivateAccountSection from './DeactivateAccountSection';

export default async function Profile() {
  const authInfo = await cachedAuthInfo();
  const currentEmail = authInfo?.bruker?.email ?? '';

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <ChangeEmailForm currentEmail={currentEmail} />
        <ChangePasswordForm />
        <DeactivateAccountSection />
      </div>
    </div>
  );
}
