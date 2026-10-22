'use client';

import { useSelectedLayoutSegments } from 'next/navigation';
import type { ReactNode } from 'react';
import { EinExpandable } from '~/components/EinExpandable/EinExpandable';
import {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useTranslation } from '~/hooks/useTranslation';
import { AnsattportenLogin } from './AnsattportenLogin';
import { CreateAccountLink } from './CreateAccountLink';
import LoginForm, { type LoginFormMode, stepNames } from './LoginForm';
import styles from './LoginModal.module.scss';

/**
 * The login modal on all of its routes (log in, forgotten password, register).
 * It renders the form itself, so the form stays mounted and reshapes between
 * them.
 */
export default function LoginModal({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const segments = useSelectedLayoutSegments();
  const mode: LoginFormMode = segments.includes('forgotten-password')
    ? 'forgottenPassword'
    : segments.includes('register')
      ? 'register'
      : 'login';

  return (
    <>
      <EinModalHeader title={t(stepNames[mode])} />
      <EinModalBody>
        <LoginForm mode={mode} />
        {children}
      </EinModalBody>
      <EinExpandable expanded={mode === 'login'} className={styles.footer}>
        <EinModalFooter>
          {/* The footer lines its children up in a row; these go in a column */}
          <div className={styles.footerOptions}>
            <CreateAccountLink />
            <AnsattportenLogin />
          </div>
        </EinModalFooter>
      </EinExpandable>
    </>
  );
}
