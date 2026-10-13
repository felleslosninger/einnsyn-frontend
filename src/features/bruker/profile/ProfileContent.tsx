'use client'; // needed for useTranslation

import { Heading } from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import styles from './ProfileForms.module.scss';

type Props = {
  currentEmail: string;
};

export default function ProfileContent({ currentEmail }: Props) {
  const t = useTranslation();

  return (
    <>
      <Heading level={2} className="ds-heading" data-size="sm">
        {t('bruker.profile')}
      </Heading>
      <div className={styles.profileList}>
        <ChangeEmailForm currentEmail={currentEmail} />
        <ChangePasswordForm />
      </div>
    </>
  );
}
