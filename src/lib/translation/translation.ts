import en from '~/resources/translations/en/translations.json';
import nb from '~/resources/translations/nb/translations.json';
import nn from '~/resources/translations/nn/translations.json';
import se from '~/resources/translations/se/translations.json';

type LanguageData = {
  [key: string]: string | LanguageData;
};
const languageData: LanguageData = {
  en,
  nb,
  nn,
  se,
};

export const supportedLanguages = ['nb', 'nn', 'en', 'se'] as const;
export type LanguageCode = (typeof supportedLanguages)[number];

/**
 *
 * @param fullKey Colon- or dot-separated key
 * @param languageCode Language code
 * @returns Translated key or fallback string
 */
const translateFunction = (
  fullKey: string,
  languageCode: string,
  ...replacements: (string | undefined)[]
) => {
  const keyArray = fullKey.split(/[:.]/);
  let current = languageData[languageCode];

  // The dictionary is a nested object, so we need to traverse it
  // to find the value for the given key.
  for (const key of keyArray) {
    if (typeof current === 'object' && current[key]) {
      current = current[key];
    } else {
      break;
    }
  }

  //  No translation was found, return the key as a fallback
  if (typeof current !== 'string') {
    return fullKey;
  }

  // Replace placeholders in the string with the provided replacements
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements[i] ?? '';
    current = current.replaceAll(`$${i + 1}`, replacement);
  }

  // Remove remaining placeholders that were not replaced
  current = current.replace(/\$\d+/g, '');

  return current.trim();
};

export const getTranslateFunction =
  (languageCode: LanguageCode) =>
  (fullKey: string, ...replacements: (string | undefined)[]) =>
    translateFunction(fullKey, languageCode, ...replacements);

/**
 *
 * @param s Accept-Language string
 * @param acceptedLanguages optional array of accepted languages
 * @returns the preferred language code
 */
export function resolveLanguageCode<
  T extends readonly string[] = LanguageCode[],
>(
  s = '',
  acceptedLanguages: readonly T[number][] = supportedLanguages,
): T[number] | undefined {
  let bestLanguage = acceptedLanguages?.[0];
  let bestQuality = 0;
  const languages = s.split(',');
  for (const language of languages) {
    const [fullLanguageCode, qualityStr] = language.split(/;[qQ]=/);
    const quality = Number.parseFloat(qualityStr || '1');
    const languageCode =
      // Pretend that this is a valid language code, we're checking below
      fullLanguageCode.split('-')[0].trim() as LanguageCode;
    if (
      quality > bestQuality &&
      (!acceptedLanguages ||
        acceptedLanguages.length === 0 ||
        acceptedLanguages.includes(languageCode))
    ) {
      bestQuality = quality;
      bestLanguage = languageCode;
    }
  }

  return bestLanguage;
}

export const isLanguageCode = (lc: unknown): lc is LanguageCode =>
  supportedLanguages.includes(lc as LanguageCode);
