'use client';

import { useFormStatus } from 'react-dom';
import { ansattportenAuthAction } from '~/actions/authentication/auth.ansattporten';
import { EinButton } from '~/components/EinButton/EinButton';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useModalBasepath } from '~/hooks/useModalBasepath';

export function AnsattportenLogin() {
  const basepath = useModalBasepath();
  const { origin } = useSessionData();
  const { pending } = useFormStatus();
  const originUrl = new URL(basepath, origin).href;

  return (
    <form action={ansattportenAuthAction}>
      <input type="hidden" name="originUrl" value={originUrl} />
      <EinButton type="submit" style="link" disabled={pending}>
        Logg inn gjennom Ansattporten
      </EinButton>
    </form>
  );
}
