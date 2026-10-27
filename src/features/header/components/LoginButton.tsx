import { EnterIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './LoginButton.module.scss';

export default function LoginButton() {
  const t = useTranslation();
  return (
    <EinButton
      asChild
      variant="tertiary"
      data-color="neutral"
      data-size="sm"
      className={styles.loginButton}
    >
      <EinLink unstyled href="/login">
        <EnterIcon aria-hidden="true" />
        {t('site.login')}
      </EinLink>
    </EinButton>
  );
}
