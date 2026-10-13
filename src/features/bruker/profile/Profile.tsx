import { Divider } from '@digdir/designsystemet-react';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import DeactivateAccountSection from './DeactivateAccountForm';
import ProfileContent from './ProfileContent';

export default async function Profile() {
  const authInfo = await cachedAuthInfo();
  const currentEmail = authInfo?.bruker?.email ?? '';

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <ProfileContent currentEmail={currentEmail} />
        <Divider />
        <DeactivateAccountSection />
      </div>
    </div>
  );
}
