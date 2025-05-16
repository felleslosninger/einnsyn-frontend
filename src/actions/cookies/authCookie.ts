'use server';

import { getCookie, updateCookie } from './cookieActions';

const SETTINGS_COOKIE_NAME = 'ein_auth';

type AuthContent = {
	authProvider: 'einnsyn' | 'ansattporten' | undefined;
	apiKey: string | undefined;
	token: string | undefined;
	refreshToken: string | undefined;
};

const defaultContent: AuthContent = {
	authProvider: undefined,
	apiKey: undefined,
	token: undefined,
	refreshToken: undefined,
};

/**
 * Wrapper for updating the auth cookie, specifying the cookie name and a low default maxAge.
 *
 * @param authContent
 * @returns
 */
export const updateAuth = async (authContent: AuthContent) => {
	return updateCookie(SETTINGS_COOKIE_NAME, authContent, {
		maxAge: 60 * 30, // 30 minutes (default)
	});
};

export const getAuth = async () => {
	const authCookieContent = await getCookie<AuthContent>(SETTINGS_COOKIE_NAME);
	return {
		...defaultContent,
		...authCookieContent,
	};
};
