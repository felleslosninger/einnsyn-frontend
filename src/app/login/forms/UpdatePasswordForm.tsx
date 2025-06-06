import cn from '~/lib/utils/className';
import { nextPath } from '../../../components/ModalContainer/ModalContainer';
import {
  validatePassword,
  validateSecret,
  validateUsername,
} from '../../../lib/utils/validators';
import { getApiClient } from '~/utils/getApiClient';
import { getAuthInfo } from '~/middleware/authMiddleware';
import { useTranslation } from '~/hooks/useTranslation';
import { Alert, Button, Input } from '@digdir/designsystemet-react';

import styles from './LoginForm.module.scss';

export const slugs = ['reset-password', 'tilbakestill-passord'];
export const Render = UpdatePasswordForm;

export const action = async (
  { context, request }: ActionFunctionArgs,
  pathParams: string[],
) => {
  const form = await request.formData();
  const username = nextPath(pathParams);
  const secret = nextPath(pathParams);
  const password = form.get('password');
  const confirmPassword = form.get('confirmPassword');
  const result: {
    success?: boolean;
    invalidPassword?: boolean;
    invalidConfirm?: boolean;
  } = {};
  const { apiKey, token } = getAuthInfo(context);
  const apiClient = getApiClient(token, apiKey);

  const invalidPassword = !validatePassword(password);
  const invalidConfirm = password !== confirmPassword;
  result.invalidPassword = invalidPassword;
  result.invalidConfirm = invalidConfirm;

  if (
    validateSecret(secret) &&
    validateUsername(username) &&
    !invalidPassword &&
    !invalidConfirm
  ) {
    try {
      await apiClient.bruker.updatePasswordWithSecret(username, secret, {
        newPassword: password,
      });
      result.success = true;
    } catch (e) {
      result.success = false;
    }
  }

  return result;
};

/**
 * Get username and secret from next path parameters. Return 404
 * if more path parameters are found.
 */
export const loader = async (
  { request }: LoaderFunctionArgs,
  pathParams: string[],
) => {
  const username = nextPath(pathParams);
  const secret = nextPath(pathParams);

  if (
    !validateUsername(username) ||
    !validateSecret(secret) ||
    pathParams.length > 0
  ) {
    throw data(null, { status: 404 });
  }
};

/**
 * Don't allow indexing of password reset pages, the URL contains a secret
 */
export const meta = () => {
  return [
    {
      name: 'robots',
      content: 'noindex',
    },
  ];
};

export default function UpdatePasswordForm() {
  const location = useLocation();
  const fetcher = useFetcher<typeof action>();
  const state = fetcher.state;
  const success = fetcher.data?.success;
  const t = useTranslation();

  const invalidPassword = !!fetcher.data?.invalidPassword;
  const invalidConfirm = !!fetcher.data?.invalidConfirm;

  return (
    <div className={cn(styles.updatePasswordContainer)}>
      {success === false && (
        <Alert severity="danger">{t('translate:site.serverError')}</Alert>
      )}
      <div className={styles.loginContainer}>
        <fetcher.Form action={location.pathname} method="post">
          <fieldset
            disabled={state === 'submitting'}
            className={styles.loginFieldset}
          >
            <Input
              name="password"
              type="password"
              id="password-input"
              label={t('translate:user.loginForm.password')}
              placeholder="**********"
              autoComplete="new-password"
              error={invalidPassword}
              errorMessage={
                invalidPassword
                  ? t('translate:validate.passwordRequirements')
                  : undefined
              }
            />
            <Input
              name="confirmPassword"
              type="password"
              id="confirm-password-input"
              label={t('translate:user.registerForm.passordConfirm')}
              placeholder="**********"
              autoComplete="new-password"
              error={invalidConfirm}
              errorMessage={
                invalidConfirm ? t('translate:validate.notEqual') : undefined
              }
            />

            <Button type="submit" size="Medium" variant="Primary">
              {t('translate:user.resetPassword.saveNewPassword')}
            </Button>
          </fieldset>
        </fetcher.Form>
      </div>
    </div>
  );
}
