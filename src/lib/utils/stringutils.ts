export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function firstString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}
