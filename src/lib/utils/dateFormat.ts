import type { LanguageCode } from '~/lib/translation/translation';

export function dateFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
) {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  return new Intl.DateTimeFormat(
    languageCode === 'en' ? 'en-GB' : 'nb-NO',
    options,
  ).format(date);
}
