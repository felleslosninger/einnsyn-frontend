'use client';

import { useFormStatus } from 'react-dom';
import { ansattportenAuthAction } from '~/actions/authentication/auth.ansattporten';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import { Chip } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';
import styles from './LoginButton.module.scss';
import { None } from 'openid-client';

export default function LoginButton() {
  const t = useTranslation();
  const basepath = useModalBasepath();
  const { origin } = useSessionData();
  const { pending } = useFormStatus();
  const originUrl = new URL(basepath, origin).href;

  return (
    <form action={ansattportenAuthAction}>
      <input type="hidden" name="originUrl" value={originUrl} />
      <Chip.Button
        type="submit"
        disabled={pending}
        data-color="brand2"
        className={cn(styles.loginButton, 'header-button')}
      >
        <span>{t('site.login')}</span>
      </Chip.Button>
    </form>
  );
}
