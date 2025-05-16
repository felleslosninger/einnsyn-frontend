import type { FC } from 'react';
import EinTransition from '~/components/EinTransition/EinTransition';
import type {} from '../ModalContainer';

import type { Metadata, ResolvingMetadata } from 'next';
import { useTranslation } from '~/hooks/useTranslation';
import type { ModalParams, ModalRoute, Props } from '~/lib/utils/routeUtils';
import * as LoginForm from './forms/LoginForm';
import * as PasswordResetRequestForm from './forms/PasswordResetRequestForm';
import * as UpdatePasswordForm from './forms/UpdatePasswordForm';

const templates: ModalRoute[] = [
	LoginForm,
	// UpdatePasswordForm,
	// PasswordResetRequestForm,
];

export const slugs = ['login', 'logg-inn'];

export const generateMetadata = async (
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> => {
	return {};
};

/**
 * Generate the title of the active modal
 */
export const Title: React.FC<ModalParams> = (args) => {
	const t = useTranslation();
	const path = args.path;
	const rootParam = path[0] || 'login';
	const template = templates.find((tmp) => tmp.slugs.includes(rootParam));

	// Delegate to child's Title if it exists
	return template?.Title ? (
		<template.Title {...args} path={path.slice(1)} />
	) : (
		<>{t('site.login')}</>
	);
};

/**
 * Render the body of the active modal
 */
const Login: FC<ModalParams> = (args) => {
	const path = args.path;
	const rootParam = path[0] || 'login';
	const template = templates.find((t) => t.slugs.includes(rootParam));

	// Shouldn't happen, this is checked in loader function
	if (!template) {
		throw new Error(`No template found for ${rootParam}`);
	}

	return (
		<EinTransition dependencies={[`Login.tsx ${rootParam}`]}>
			<div>
				<template.Render {...args} path={path.slice(1)} />
			</div>
		</EinTransition>
	);
};
export default Login;
export const Render = Login;
