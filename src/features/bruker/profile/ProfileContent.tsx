import { Heading } from '@digdir/designsystemet-react';
import { getTranslator } from '~/lib/translation/translation.actions';
import ChangeEmailForm from './ChangeEmailForm';
import ChangePasswordForm from './ChangePasswordForm';
import styles from './ProfileForms.module.scss';

type Props = {
  currentEmail: string;
};

export default async function ProfileContent({ currentEmail }: Props) {
  const t = await getTranslator();

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
