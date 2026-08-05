/**
 * Format a Norwegian org number as 3-3-3 ("921707134" → "921 707 134").
 *
 * Anything that is not nine digits after stripping whitespace is returned
 * unchanged, so unexpected values are shown as-is rather than mangled.
 */
export function formatOrgnummer(orgnr: string | null | undefined): string {
  if (!orgnr) return '';
  const digits = orgnr.replace(/\s/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return orgnr;
}
