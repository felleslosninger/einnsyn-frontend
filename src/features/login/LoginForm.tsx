'use client';

import { Alert, Checkbox } from '@digdir/designsystemet-react';
import {
  useActionState,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { EinLink } from '~/components/EinLink/EinLink';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import {
  eInnsynLoginAction,
  registerAction,
  requestPasswordResetAction,
} from '~/lib/auth/auth.actions';
import cn from '~/lib/utils/className';
import { validatePassword } from '~/lib/utils/validators';
import styles from './LoginForm.module.scss';

export type FormStateType = 'idle' | 'error' | 'submitting';

export type LoginFormMode = 'login' | 'forgottenPassword' | 'register';

/** Each step's name, on its submit button and as the modal's title. */
export const stepNames: Record<LoginFormMode, string> = {
  login: 'site.login',
  forgottenPassword: 'site.resetPassword',
  register: 'site.createAccount',
};

type Notice = {
  mode: LoginFormMode;
  color: 'danger' | 'success';
  message: string;
};

/**
 * Logs in, asks for a password reset link, or registers an account. One form
 * serves all three, so the email field stays put while the rest changes
 * around it.
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
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(!!settings?.stayLoggedIn);
  const [notice, setNotice] = useState<Notice>();
  const navigation = useNavigation();
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const hasPassword = isLogin || isRegister;
  const passwordHintId = useId();
  const passwordInput = useRef<HTMLInputElement>(null);
  const passwordRepeatInput = useRef<HTMLInputElement>(null);
  const forgotPasswordLink = useRef<HTMLAnchorElement>(null);
  const backToLoginLink = useRef<HTMLAnchorElement>(null);
  const focusOnLogin = useRef<HTMLElement>(null);

  const [loginState, loginAction, isLoggingIn] = useActionState(
    eInnsynLoginAction,
    {},
  );
  const [resetState, resetAction, isResetting] = useActionState(
    requestPasswordResetAction,
    {},
  );
  const [registerState, registerFormAction, isRegistering] = useActionState(
    registerAction,
    {},
  );

  // A message is gone once you leave its step, also when you come back.
  if (notice && notice.mode !== mode) {
    setNotice(undefined);
  }

  // The message box keeps its last message while it closes
  const [shownNotice, setShownNotice] = useState<Notice>();
  if (notice && notice !== shownNotice) {
    setShownNotice(notice);
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

  useEffect(() => {
    if (registerState.sent || registerState.error) {
      setNotice({
        mode: 'register',
        color: registerState.sent ? 'success' : 'danger',
        message: registerState.sent ? 'site.registerSent' : 'site.unknownError',
      });
    }
  }, [registerState]);

  // Close the modal if login is successful
  useEffect(() => {
    if (loginState.success) {
      navigation.closeModal();
    }
  }, [loginState.success, navigation]);

  // The browser holds back the submit with these messages. Only a new password
  // has to follow the rules.
  useEffect(() => {
    passwordInput.current?.setCustomValidity(
      isRegister && password && !validatePassword(password)
        ? t('site.passwordRequirements')
        : '',
    );
    passwordRepeatInput.current?.setCustomValidity(
      isRegister && passwordRepeat !== password
        ? t('site.passwordsDoNotMatch')
        : '',
    );
  }, [isRegister, password, passwordRepeat, t]);

  // Focus that leaves with the login step (also from the footer) goes to
  // "Tilbake til innlogging", and from there back to where it was. Before
  // paint, while the browser still reports the inert element as focused.
  // Without scrolling: the target is still collapsed, and scrolling to it
  // would shift the whole modal while it opens.
  useLayoutEffect(() => {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !focused.closest('[inert]')) {
      return;
    }
    const target = isLogin
      ? (focusOnLogin.current ?? forgotPasswordLink.current)
      : backToLoginLink.current;
    if (!isLogin) {
      focusOnLogin.current = focused;
    }
    target?.focus({ preventScroll: true });
  }, [isLogin]);

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

  const onUpdatePasswordRepeat = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPasswordRepeat(event.target.value);
  };

  const onUpdateStayLoggedIn = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStayLoggedIn(event.target.checked);
  };

  const formAction = {
    login: loginAction,
    forgottenPassword: resetAction,
    register: registerFormAction,
  }[mode];

  return (
    <form action={formAction}>
      <fieldset className={cn('ds-fieldset', styles.loginFieldset)}>
        <div className={cn(styles.collapsible, styles.notice)} inert={!notice}>
          {/* The box that collapses: the alert's padding can't shrink away */}
          <div>
            {shownNotice && (
              <Alert
                data-color={shownNotice.color}
                className={styles.formAlert}
              >
                {t(shownNotice.message)}
              </Alert>
            )}
          </div>
        </div>
        <EinInput
          className={styles.username}
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

        <div className={styles.collapsible} inert={!hasPassword}>
          <EinInput
            ref={passwordInput}
            // Without a name it stays out of the reset request
            name={hasPassword ? 'password' : undefined}
            type="password"
            label={
              <>
                {t('site.password')}
                {/* Points to the rules below, which the field reads out */}
                {isRegister && <span aria-hidden>*</span>}
              </>
            }
            placeholder={t('site.passwordPlaceholder')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            aria-describedby={isRegister ? passwordHintId : undefined}
            onChange={onUpdatePassword}
            onKeyDown={onKeyDown}
            value={password}
            required={hasPassword}
            fullWidth
          />
        </div>
        <div className={styles.collapsible} inert={!isRegister}>
          <EinInput
            ref={passwordRepeatInput}
            name={isRegister ? 'passwordRepeat' : undefined}
            type="password"
            label={t('site.repeatPassword')}
            placeholder={t('site.passwordPlaceholder')}
            autoComplete="new-password"
            onChange={onUpdatePasswordRepeat}
            onKeyDown={onKeyDown}
            value={passwordRepeat}
            required={isRegister}
            fullWidth
          />
        </div>
        <div
          className={cn(styles.collapsible, styles.passwordHint)}
          inert={!isRegister}
        >
          <p id={passwordHintId}>
            <span aria-hidden>* </span>
            {t('site.passwordRequirements')}
          </p>
        </div>
        <div className={styles.collapsible} inert={!isLogin}>
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
              ref={forgotPasswordLink}
              href="/login/forgotten-password"
              className={styles.forgotPasswordLink}
            >
              {t('site.forgottenPassword')}
            </EinLink>
          </div>
        </div>
        <div className={styles.loginOptionsContainer}>
          <EinButton
            type="submit"
            fullWidth
            disabled={isLoggingIn || isResetting || isRegistering}
          >
            {t(stepNames[mode])}
          </EinButton>
          <div
            className={cn(styles.collapsible, styles.backToLogin)}
            inert={isLogin}
          >
            <EinLink ref={backToLoginLink} href="/login">
              {t('site.backToLogin')}
            </EinLink>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
