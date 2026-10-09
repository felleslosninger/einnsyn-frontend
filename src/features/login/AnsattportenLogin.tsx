'use client';

import { useFormStatus } from 'react-dom';
import { EinButton } from '~/components/EinButton/EinButton';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import { ansattportenAuthAction } from '~/lib/auth/auth.actions';

export function AnsattportenLogin() {
  const basepath = useModalBasepath();
  const { pending } = useFormStatus();

  return (
    <form action={ansattportenAuthAction} data-size="sm">
      <input type="hidden" name="returnPath" value={basepath} />
      Forvalter du en virksomhet? <br />
      <EinButton type="submit" style="link" disabled={pending}>
        Logg inn gjennom Ansattporten
      </EinButton>
    </form>
  );
}
