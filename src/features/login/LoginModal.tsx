'use client';

import { PersonPlusIcon } from '@navikt/aksel-icons';
import { useSelectedLayoutSegments } from 'next/navigation';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import DigdirIcon from '~/components/DigdirIcon';
import { EinExpandable } from '~/components/EinExpandable/EinExpandable';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useTranslation } from '~/hooks/useTranslation';
import { AnsattportenLoginButton } from './AnsattportenLoginButton';
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
            <LoginOption icon={PersonPlusIcon} prompt={t('site.noAccount')}>
              <EinLink href="/login/register">
                {t('site.createAccount')}
              </EinLink>
            </LoginOption>
            <LoginOption
              icon={DigdirIcon}
              prompt={t('site.managesOrganization')}
            >
              <AnsattportenLoginButton />
            </LoginOption>
          </div>
        </EinModalFooter>
      </EinExpandable>
    </>
  );
}

function LoginOption({
  icon: Icon,
  prompt,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  prompt: string;
  children: ReactNode;
}) {
  return (
    <div data-size="sm" className={styles.option}>
      <Icon aria-hidden className={styles.optionIcon} />
      <div className={styles.optionText}>
        {prompt}
        {children}
      </div>
    </div>
  );
}
