'use client';

import { useFormStatus } from 'react-dom';
import { ansattportenAuthAction } from '~/actions/authentication/auth.ansattporten';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { EinButton } from '~/components/EinButton/EinButton';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';

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
