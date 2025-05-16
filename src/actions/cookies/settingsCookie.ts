'use server';

import type { LanguageCode } from '~/lib/translation/translation';
import { getCookie, updateCookie } from './cookieActions';

const SETTINGS_COOKIE_NAME = 'ein_settings';

type SettingsContent = {
	language: LanguageCode;
	stayLoggedIn: boolean;
};

const defaultSettings: SettingsContent = {
	language: 'nb',
	stayLoggedIn: false,
};

/**
 * Wrapper for updating the settings cookie, specifying the cookie name and a high default maxAge.
 *
 * @param authContent
 * @returns
 */
export const updateSettings = async (settingsContent: SettingsContent) => {
	return updateCookie(SETTINGS_COOKIE_NAME, settingsContent, {
		maxAge: 60 * 60 * 24 * 365, // 365 days
	});
};

export const getSettings = async () => {
	const settingsCookieContent =
		await getCookie<SettingsContent>(SETTINGS_COOKIE_NAME);
	return {
		...defaultSettings,
		...settingsCookieContent,
	};
};
