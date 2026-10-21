'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import { useActionState, useEffect, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import {
  eInnsynLoginAction,
  requestPasswordResetAction,
} from '~/lib/auth/auth.actions';
import cn from '~/lib/utils/className';
import styles from './LoginForm.module.scss';

export type FormStateType = 'idle' | 'error' | 'submitting';

export type LoginFormMode = 'login' | 'forgottenPassword';

type Notice = {
  mode: LoginFormMode;
  color: 'danger' | 'success';
  message: string;
};

/**
 * Logs in, or asks for a password reset link. One form serves both, so the
 * email field stays put while the rest changes around it.
 */
export default function LoginForm({
  mode = 'login',
}: {
  mode?: LoginFormMode;
}) {
  const t = useTranslation();
  const { settings } = useSessionData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(!!settings?.stayLoggedIn);
  const [notice, setNotice] = useState<Notice>();
  const navigation = useNavigation();
  const isLogin = mode === 'login';

  const [loginState, loginAction, isLoggingIn] = useActionState(
    eInnsynLoginAction,
    {},
  );
  const [resetState, resetAction, isResetting] = useActionState(
    requestPasswordResetAction,
    {},
  );

  // A message is gone once you leave its step, also when you come back.
  if (notice && notice.mode !== mode) {
    setNotice(undefined);
  }

  // Every submit returns a new state, so a repeated error shows again.
  useEffect(() => {
    if (loginState.error) {
      setNotice({
        mode: 'login',
        color: 'danger',
        message:
          loginState.error === 'authenticationError'
            ? 'site.invalidUsernameOrPassword'
            : 'site.unknownError',
      });
    }
  }, [loginState]);

  useEffect(() => {
    if (resetState.sent || resetState.error) {
      setNotice({
        mode: 'forgottenPassword',
        color: resetState.sent ? 'success' : 'danger',
        message: resetState.sent
          ? 'site.resetPasswordSent'
          : 'site.unknownError',
      });
    }
  }, [resetState]);

  // Close the modal if login is successful
  useEffect(() => {
    if (loginState.success) {
      navigation.closeModal();
    }
  }, [loginState.success, navigation]);

  const onKeyDown = (_event: React.KeyboardEvent<HTMLInputElement>) => {
    setNotice(undefined);
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
    <form action={isLogin ? loginAction : resetAction}>
      <fieldset className={cn('ds-fieldset', styles.loginFieldset)}>
        {notice && (
          <Alert data-color={notice.color} className={styles.formAlert}>
            {t(notice.message)}
          </Alert>
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

        <div className={styles.passwordField} inert={!isLogin}>
          <EinInput
            // Without a name it stays out of the reset request
            name={isLogin ? 'password' : undefined}
            type="password"
            label={t('site.password')}
            placeholder={t('site.passwordPlaceholder')}
            autoComplete="current-password"
            onChange={onUpdatePassword}
            onKeyDown={onKeyDown}
            value={password}
            required={isLogin}
            fullWidth
          />
        </div>
        <div className={styles.loginOptionsContainer}>
          <div className={styles.rememberForgottenWrapper}>
            <div className={styles.stayLoggedIn} inert={!isLogin}>
              <Checkbox
                name="stayLoggedIn"
                value={stayLoggedIn ? 'checked' : undefined}
                checked={stayLoggedIn}
                onChange={onUpdateStayLoggedIn}
                data-size="sm"
                label={t('site.stayLoggedIn')}
              />
            </div>
            <EinLink
              href={isLogin ? '/login/forgotten-password' : '/login'}
              className={styles.forgotPasswordLink}
            >
              {isLogin ? t('site.forgottenPassword') : t('site.backToLogin')}
            </EinLink>
          </div>
          <EinButton
            type="submit"
            fullWidth
            disabled={isLoggingIn || isResetting}
          >
            {isLogin ? t('site.login') : t('site.resetPassword')}
          </EinButton>
        </div>
      </fieldset>
    </form>
  );
}
