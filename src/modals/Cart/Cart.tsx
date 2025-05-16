import EinTransition from '~/components/EinTransition/EinTransition';
import { getTemplate } from '../ModalContainer';

import { useTranslation } from '~/hooks/useTranslation';
import type {
	ModalActionFunction,
	ModalParams,
	ModalRoute,
} from '~/lib/utils/routeUtils';
//import * as UpdatePasswordForm from './Forms/UpdatePasswordForm';
import * as Login from './forms/Login';
import * as Register from './forms/Register';
import * as Select from './forms/Select';
const templates: ModalRoute[] = [Login, Register, Select];

export const slugs = ['cart', 'bestillingskurv'];
export const Render = Cart;

export const action: ModalActionFunction = async (args) => {
	const { path } = args;
	const pathParams = path.split('/');
	const template = getTemplate(templates, pathParams);
	return template?.action?.(args, pathParams.slice(1)) ?? null;
};

/**
 * Generate the title of the active modal
 */
export const Title: React.FC<ModalParams> = ({ path }) => {
	const t = useTranslation();
	const pathParams = path.split('/');
	const rootParam = pathParams[0] || '';
	const template = templates.find((tmp) => tmp.slugs.includes(rootParam));

	// Delegate to child's Title if it exists
	return template?.Title ? (
		<template.Title path={pathParams.slice(1).join('/')} />
	) : (
		<>{t('translate:user.cart')}</>
	);
};

/**
 * Render the body of the active modal
 */
export default function Cart({ path }: ModalParams) {
	const pathParams = path.split('/');
	const rootParam = pathParams[0] || '';
	const template = templates.find((t) => t.slugs.includes(rootParam));

	// Shouldn't happen, this is checked in loader function
	if (!template) {
		throw new Error(`No template found for ${rootParam}`);
	}

	return (
		<EinTransition dependencies={[rootParam]}>
			<div>
				<template.Render path={pathParams.slice(1).join('/')} />
			</div>
		</EinTransition>
	);
}
