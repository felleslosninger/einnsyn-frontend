'use client';

import { useFormStatus } from 'react-dom';
import DigdirIcon from '~/components/DigdirIcon';
import { EinButton } from '~/components/EinButton/EinButton';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { ansattportenAuthAction } from '~/lib/auth/auth.actions';
import styles from './AnsattportenLogin.module.scss';

export function AnsattportenLogin() {
  const { href } = useNavigation();
  const { origin } = useSessionData();
  const { pending } = useFormStatus();
  const originUrl = new URL(href, origin).href;

  return (
    <form
      action={ansattportenAuthAction}
      data-size="sm"
      className={styles.ansattportenLogin}
    >
      <input type="hidden" name="originUrl" value={originUrl} />
      <DigdirIcon aria-hidden className={styles.digdirIcon} />
      <div>
        Forvalter du en virksomhet? <br />
        <EinButton type="submit" style="link" disabled={pending}>
          Logg inn gjennom Ansattporten
        </EinButton>
      </div>
    </form>
  );
}
