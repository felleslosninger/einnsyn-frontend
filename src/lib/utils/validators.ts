// The API's rule: lower and upper case, and a digit or special character
export const passwordRegexp = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9\W]).{8,}$/,
);
export const emailRegexp = new RegExp(/.@./);

export function validateUsername(username: unknown): username is string {
  return typeof username === 'string' && emailRegexp.test(username);
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && passwordRegexp.test(password);
}

export function validateSecret(secret: unknown): secret is string {
  return typeof secret === 'string' && secret.length > 0;
}
