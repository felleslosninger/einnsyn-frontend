import type { LanguageCode } from '~/lib/translation/translation';

/**
 * A Norwegian phone number's display text and `tel:` link. Eight digits are
 * grouped in pairs, with "+47" shown only in English; five-digit short numbers
 * are kept as they are.
 *
 * Anything else is shown unchanged and not linked, since it may not be a
 * dialable number.
 */
export function formatPhoneNumber(
  phoneNumber: string,
  languageCode: LanguageCode,
): { text: string; href?: string } {
  const compact = phoneNumber.replace(/\s/g, '');
  const digits = compact.match(/^(?:\+47|0047)?(\d{8})$/)?.[1];
  if (digits) {
    const pairs = digits.replace(/\d\d(?=\d)/g, '$& ');
    return {
      text: languageCode === 'en' ? `+47 ${pairs}` : pairs,
      href: `tel:+47${digits}`,
    };
  }

  // 5-digit "spesialnummer": only reachable from inside Norway, so no "+47".
  if (/^0\d{4}$/.test(compact)) {
    return { text: compact, href: `tel:${compact}` };
  }

  return { text: phoneNumber };
}
