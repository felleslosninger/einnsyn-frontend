import {
  getIntlLocale,
  type LanguageCode,
} from '~/lib/translation/translation';

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

  return new Intl.DateTimeFormat(getIntlLocale(languageCode), options).format(
    date,
  );
}

// A chart labels every point on each render, and a formatter is costly to build.
const monthFormats = new Map<string, Intl.DateTimeFormat>();

/** "nov. 2025" or "november 2025", in UTC like the API's monthly buckets. */
export function monthFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
  month: 'short' | 'long' = 'short',
) {
  const locale = getIntlLocale(languageCode);
  const key = `${locale}|${month}`;
  let format = monthFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month,
      timeZone: 'UTC',
    });
    monthFormats.set(key, format);
  }
  return format.format(new Date(timestamp));
}
