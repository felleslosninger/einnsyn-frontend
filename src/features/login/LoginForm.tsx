'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import { useActionState, useEffect, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import { eInnsynLoginAction } from '~/actions/authentication/auth.eInnsyn';
import { useModalBasepath } from '~/app/@modal/ModalWrapper';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import {
  EinModalBody,
  EinModalFooter,
  EinModalHeader,
} from '~/components/EinModal/EinModal';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { AnsattportenLogin } from './AnsattportenLogin';
import styles from './LoginForm.module.scss';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';

export type FormStateType = 'idle' | 'error' | 'submitting';

export default function LoginForm() {
  const t = useTranslation();
  const { settings } = useSessionData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(!!settings?.stayLoggedIn);
  const [displayedError, setDisplayedError] = useState<string | undefined>();
  const navigation = useNavigation();
  const basepath = useModalBasepath();

  const [loginState, formAction, isPending] = useActionState(
    eInnsynLoginAction,
    {},
  );

  // Update displayed error message
  useEffect(() => {
    if (!isPending) {
      if (loginState.error === 'authenticationError') {
        setDisplayedError(t('site.invalidUsernameOrPassword'));
      } else if (loginState.error) {
        setDisplayedError(t('site.unknownError'));
      } else {
        setDisplayedError(undefined);
      }
    }
  }, [isPending, loginState.error, t]);

  // Redirect to basepath if login is successful
  useEffect(() => {
    if (loginState.success) {
      navigation.push(basepath);
    }
  }, [loginState.success, navigation, basepath]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setDisplayedError(undefined);
  };

  // Update username
  const onUpdateUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  // Update password
  const onUpdatePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const onUpdateStayLoggedIn = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStayLoggedIn(event.target.checked);
  };

  return (
    <>
      <EinModalHeader title={t('site.login')} />
      <EinModalBody>
        <form className={cn(styles.loginContainer)} action={formAction}>
          <fieldset className={cn(styles.loginFieldset)}>
            {displayedError && (
              <Alert data-color="danger">{displayedError}</Alert>
            )}
            <EinInput
              name="username"
              type="email"
              autoComplete="email"
              label={t('site.username')}
              placeholder={t('site.usernamePlaceholder')}
              onChange={onUpdateUsername}
              onKeyDown={onKeyDown}
              value={username}
              required
              fullWidth
            />

            <EinInput
              name="password"
              type="password"
              label={t('site.password')}
              placeholder={t('site.passwordPlaceholder')}
              autoComplete="current-password"
              onChange={onUpdatePassword}
              onKeyDown={onKeyDown}
              value={password}
              required
              fullWidth
            />
            <div className={styles.loginOptionsContainer}>
              <div className={styles.rememberForgottenWrapper}>
                <Checkbox
                  name="stayLoggedIn"
                  value={stayLoggedIn ? 'checked' : undefined}
                  checked={stayLoggedIn}
                  onChange={onUpdateStayLoggedIn}
                  data-size="sm"
                  label={t('site.stayLoggedIn')}
                />
                <EinLink
                  href="/login/forgotten-password"
                  className={styles.forgotPasswordLink}
                >
                  {t('site.forgottenPassword')}
                </EinLink>
              </div>
              <EinButton type="submit" fullWidth disabled={isPending}>
                {t('site.login')}
              </EinButton>
            </div>
          </fieldset>
        </form>
      </EinModalBody>
      <EinModalFooter>
        <AnsattportenLogin />
      </EinModalFooter>
    </>
  );
}
