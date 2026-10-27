'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { EinButton } from '~/components/EinButton/EinButton';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import { ansattportenAuthAction } from '~/lib/auth/auth.actions';

export function AnsattportenLoginButton() {
  const t = useTranslation();
  const { href } = useNavigation();
  const { origin } = useSessionData();
  const originUrl = new URL(href, origin).href;

  return (
    <form action={ansattportenAuthAction}>
      <input type="hidden" name="originUrl" value={originUrl} />
      <SubmitButton>{t('site.ansattportenLogin')}</SubmitButton>
    </form>
  );
}

// useFormStatus only sees a form rendered by a parent component
function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <EinButton type="submit" style="link" disabled={pending}>
      {children}
    </EinButton>
  );
}
