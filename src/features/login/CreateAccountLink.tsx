'use client';

import { PersonPlusIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './CreateAccountLink.module.scss';

/** The way to the register step, in the login modal's footer. */
export function CreateAccountLink() {
  const t = useTranslation();

  return (
    <div data-size="sm" className={styles.createAccount}>
      <PersonPlusIcon aria-hidden className={styles.icon} />
      <div>
        {t('site.noAccount')} <br />
        <EinLink href="/login/register">{t('site.createAccount')}</EinLink>
      </div>
    </div>
  );
}
