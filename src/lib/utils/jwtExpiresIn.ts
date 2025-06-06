// Naively parse a JWT to extract the expiration time.
export function jwtExpiresIn(jwt: string | undefined): number | undefined {
  if (!jwt) {
    return undefined;
  }

  try {
    const payload = JSON.parse(atob(jwt.split('.')[1])) as {
      exp?: number;
    };
    return payload.exp;
  } catch (error) {
    return undefined;
  }
}
