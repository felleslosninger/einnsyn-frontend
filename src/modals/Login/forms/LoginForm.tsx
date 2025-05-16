import { Checkbox, Link } from '@digdir/designsystemet-react';
import {
	useActionState,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { useModalBasepath } from '~/hooks/useModalBasepath';
import cn from '~/lib/utils/className';

import { EinButton } from '~/components/EinButton/EinButton';
import { EinInput } from '~/components/EinInput/EinInput';
import { login } from './LoginForm.actions';
import styles from './LoginForm.module.scss';

export type FormStateType = 'idle' | 'error' | 'submitting';

export const slugs = ['', 'login'];
export const Render = LoginForm;

export default function LoginForm() {
	const t = useTranslation();
	const basepath = useModalBasepath();
	const usernameInputRef = useRef<HTMLInputElement>(null);
	const passwordInputRef = useRef<HTMLInputElement>(null);

	const [loginState, formAction, isPending] = useActionState(login, {});

	// Mark fields as invalid only if they are unchanged from the last login attempt
	const invalidUsername = false;
	const invalidPassword = false;

	// If fields are marked as invalid, we need to trigger a re-render on input.
	const [keyPress, setKeyPress] = useState(0);
	const updateKeyPressed = useCallback(() => {
		setKeyPress(keyPress + 1);
	}, [keyPress]);

	// Listen to username changes
	useEffect(() => {
		const usernameInput = usernameInputRef.current;
		if (invalidUsername && usernameInput) {
			usernameInput.addEventListener('keyup', updateKeyPressed);
			return () => usernameInput.removeEventListener('keyup', updateKeyPressed);
		}
	}, [invalidUsername, updateKeyPressed]);

	// Listen to password changes
	useEffect(() => {
		const passwordInput = passwordInputRef.current;
		if (invalidPassword && passwordInput) {
			passwordInput.addEventListener('keyup', updateKeyPressed);
			return () => passwordInput.removeEventListener('keyup', updateKeyPressed);
		}
	}, [invalidPassword, updateKeyPressed]);

	return (
		<form
			className={cn(styles.loginContainer)}
			action={formAction}
			method="post"
		>
			<fieldset className={cn(styles.loginFieldset)}>
				<EinInput
					name="username"
					type="email"
					id="username-input"
					autoComplete="email"
					ref={usernameInputRef}
					label={t('site.username')}
					placeholder="ola@nordmann.no"
					fullWidth
					errorMessage={
						invalidUsername ? t('translate:validate.invalidEmail') : undefined
					}
				/>

				<EinInput
					name="password"
					type="password"
					id="password-input"
					label={t('site.password')}
					placeholder="**********"
					autoComplete="current-password"
					ref={passwordInputRef}
					fullWidth
					errorMessage={
						invalidPassword
							? t('translate:validate.passwordRequirements')
							: undefined
					}
				/>
				<div className={styles.loginOptionsContainer}>
					<div className={styles.rememberForgottenWrapper}>
						<Checkbox
							name="stay-logged-in"
							id="stay-logged-in"
							value="checked"
							data-size="sm"
							label={t('site.stayLoggedIn')}
						/>
						<Link
							to={`${basepath}/login/forgotten-password`}
							className={styles.forgotPasswordLink}
						>
							{t('site.forgottenPassword')}
						</Link>
					</div>
					<EinButton type="submit" fullWidth>
						{isPending ? t('site.loggingIn') : t('site.login')}
					</EinButton>
				</div>
			</fieldset>
		</form>
	);
}
