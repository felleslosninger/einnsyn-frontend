import styles from './LoginForm.module.scss';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import cn from '~/lib/utils/className';
import { useTranslation } from '~/hooks/useTranslation';
import { Alert, Button, Input, Link } from '@digdir/designsystemet-react';

export const slugs = ['forgotten-password', 'glemt-passord'];
export const Render = PasswordResetRequestForm;

export default function PasswordResetRequestForm() {
	const location = useLocation();
	const t = useTranslation();
	const basepath = useModalBasepath();
	const fetcher = useFetcher<typeof action>();
	const state = fetcher.state;
	const success = fetcher.data?.success;
	const invalid = fetcher.data?.invalid;

	return (
		<div className={cn(styles.loginContainer)}>
			{success === true && (
				<Alert severity="success">
					{t('translate:user.resetPassword.request')}
				</Alert>
			)}

			{success !== true && (
				<>
					{success === false && (
						<Alert severity="danger">{t('translate:site.serverError')}</Alert>
					)}

					<fetcher.Form action={location.pathname} method="post">
						<fieldset
							disabled={state === 'submitting'}
							className={styles.loginFieldset}
						>
							<Input
								name="username"
								type="email"
								id="username-input"
								autoComplete="email"
								label={t('translate:user.loginForm.username')}
								placeholder="ola@nordmann.no"
								error={invalid === true}
								errorMessage={
									invalid === true
										? t('translate:validate.invalidEmail')
										: undefined
								}
							/>
							<Button type="submit" size="Medium" variant="Primary">
								{t('translate:common.send')}
							</Button>
							<Link
								href={`${basepath}/login`}
								className={styles.forgotPasswordLink}
							>
								{t('site.login')}
							</Link>
						</fieldset>
					</fetcher.Form>
				</>
			)}
		</div>
	);
}
