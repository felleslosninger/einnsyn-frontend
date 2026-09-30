'use client';

import { useFormStatus } from 'react-dom';
import { EinButton } from '~/components/EinButton/EinButton';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import { ansattportenAuthAction } from '~/lib/auth/auth.actions';

export function AnsattportenLogin() {
  const basepath = useModalBasepath();
  const { origin } = useSessionData();
  const { pending } = useFormStatus();
  const originUrl = new URL(basepath, origin).href;

  return (
    <form action={ansattportenAuthAction} data-size="sm">
      <input type="hidden" name="originUrl" value={originUrl} />
      Forvalter du en virksomhet? <br />
      <EinButton type="submit" style="link" disabled={pending}>
        Logg inn gjennom Ansattporten
      </EinButton>
    </form>
  );
}
