import { EnterIcon } from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { buildPathname } from '~/lib/routing/pathname';
import styles from './LoginButton.module.scss';

export default function LoginButton() {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  return (
    <EinButton
      asChild
      variant="tertiary"
      data-color="neutral"
      data-size="sm"
      className={styles.loginButton}
    >
      <EinLink unstyled href={buildPathname({ page: 'login' }, languageCode)}>
        <EnterIcon aria-hidden="true" />
        {t('site.login')}
      </EinLink>
    </EinButton>
  );
}
