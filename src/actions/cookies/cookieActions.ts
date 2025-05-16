'use server';

import { cookies } from 'next/headers';

const defaultCookieSettings = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 365,
};
export type CookieSettings = typeof defaultCookieSettings;

export async function getCookie<T>(cookieName: string): Promise<T | null> {
	const cookieStore = await cookies();
	const cookie = cookieStore.get(cookieName);

	try {
		const json = cookie?.value ? JSON.parse(cookie.value) : null;
		return json as T;
	} catch (error) {
		return null;
	}
}

export async function updateCookie<T>(
	cookieName: string,
	newContent: Partial<T>,
	cookieSettings: Partial<CookieSettings> = {},
): Promise<Partial<T>> {
	const cookieStore = await cookies();
	const currentContent = await getCookie<T>(cookieName);

	const content = {
		...currentContent,
		...newContent,
	};

	cookieStore.set(cookieName, JSON.stringify(content), {
		...defaultCookieSettings,
		...cookieSettings,
	});

	return content;
}
