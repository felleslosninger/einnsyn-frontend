'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useTranslation } from '~/hooks/useTranslation';
import { AnsattportenLogin } from './AnsattportenLogin';
import LoginForm from './LoginForm';

/**
 * The login modal on all of its routes (log in, forgotten password). It renders
 * the form itself, so the form stays mounted and reshapes between them.
 */
export default function LoginModal({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const mode = useSelectedLayoutSegments().includes('forgotten-password')
    ? 'forgottenPassword'
    : 'login';

  return (
    <>
      <EinModalHeader title={t('site.login')} />
      <EinModalBody>
        <LoginForm mode={mode} />
        {children}
      </EinModalBody>
      <EinModalFooter>
        <AnsattportenLogin />
      </EinModalFooter>
    </>
  );
}
