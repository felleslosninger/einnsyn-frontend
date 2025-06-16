'use client';

import { useFormStatus } from 'react-dom';
import { ansattportenAuthAction } from '~/actions/authentication/auth.ansattporten';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { EinButton } from '~/components/EinButton/EinButton';

export function AnsattportenLogin() {
  const basepath = useModalBasepath();
  const originUrl = new URL(basepath, process.env.NEXT_PUBLIC_BASE_URL).href;
  const { pending } = useFormStatus();

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
