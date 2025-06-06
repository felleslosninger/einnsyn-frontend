'use server';

import crypto from 'node:crypto';

const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';
const KEY = 'abc';

const encrypt = (text: string) => {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

	const encryptedCookie = Buffer.concat([
		Buffer.from('v10'), // Prefix
		iv, // Nonce
		cipher.update(text, 'utf8'), // Encrypted data
		cipher.final(), // Final block
		cipher.getAuthTag(), // Authentication tag
	]);

	return encryptedCookie.toString('base64');
};

function decrypt(encryptedText: string): string | null {
	try {
		const parts = encryptedText.split(':');
		if (parts.length !== 3) {
			console.error('Invalid encrypted cookie format.');
			return null;
		}

		const iv = Buffer.from(parts[0], 'base64');
		const authTag = Buffer.from(parts[1], 'base64');
		const encryptedData = parts[2];

		const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv); // Node.js crypto
		decipher.setAuthTag(authTag); // Node.js crypto

		let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (error) {
		// ... (error handling)
		return null;
	}
}
