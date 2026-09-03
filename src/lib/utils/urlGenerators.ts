import type {
  Dokumentobjekt,
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { useCallback } from 'react';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import {
  getTranslateFunction,
  type TranslateFunction,
} from '~/lib/translation/translation';

/**
 * The identifier a reference contributes to a URL.
 *
 * An entity contributes its slug, or its id when it has none — encoded, since
 * slugs are derived from names and carry Norwegian and Sámi characters. A
 * string is used verbatim: it is either a collapsed reference (a bare id, which
 * needs no encoding) or a caller-supplied identifier, which has to stay
 * byte-identical to the pathname it came from.
 */
function identifierSegment(
  reference: { slug?: string; id: string } | string | undefined,
): string {
  if (!reference) return '';
  if (typeof reference === 'string') return reference;
  return encodeURIComponent(reference.slug ?? reference.id);
}

/**
 * @param saksmappe The saksmappe, or a URL-safe identifier for it. Callers that
 * must not change the `[saksmappe]` route param pass the identifier — see
 * `JournalpostList`, where a slug/id swap remounts the subtree.
 */
export function generateSaksmappeURL(
  saksmappe: Saksmappe | string,
  t: TranslateFunction,
): string {
  return `/${t('routing.saksmappePath')}/${identifierSegment(saksmappe)}`;
}

/** @param saksmappe The parent saksmappe. See {@link generateSaksmappeURL}. */
export function generateJournalpostURL(
  journalpost: Journalpost,
  t: TranslateFunction,
  saksmappe: Saksmappe | string | undefined = journalpost.saksmappe,
): string {
  return `/${t('routing.saksmappePath')}/${identifierSegment(saksmappe)}/${t('journalpost.pathName')}/${identifierSegment(journalpost)}`;
}

export function generateMoetemappeURL(
  moetemappe: Moetemappe,
  t: TranslateFunction,
): string {
  return `/${t('routing.moetemappePath')}/${identifierSegment(moetemappe)}`;
}

export function generateMoetesakURL(
  moetesak: Moetesak,
  t: TranslateFunction,
): string {
  return `/${t('routing.moetemappePath')}/${identifierSegment(moetesak.moetemappe)}/${t('moetesak.pathName')}/${identifierSegment(moetesak)}`;
}

// Hook wrappers for use in client components
export function useSaksmappeURLGenerator() {
  const languageCode = useLanguageCode();
  return useCallback(
    (saksmappe: Saksmappe | string) =>
      generateSaksmappeURL(saksmappe, getTranslateFunction(languageCode)),
    [languageCode],
  );
}

export function useJournalpostURLGenerator() {
  const languageCode = useLanguageCode();
  return useCallback(
    (journalpost: Journalpost, saksmappe?: Saksmappe | string) =>
      generateJournalpostURL(
        journalpost,
        getTranslateFunction(languageCode),
        saksmappe,
      ),
    [languageCode],
  );
}

export function useMoetemappeURLGenerator() {
  const languageCode = useLanguageCode();
  return useCallback(
    (moetemappe: Moetemappe) =>
      generateMoetemappeURL(moetemappe, getTranslateFunction(languageCode)),
    [languageCode],
  );
}

export function useMoetesakURLGenerator() {
  const languageCode = useLanguageCode();
  return useCallback(
    (moetesak: Moetesak) =>
      generateMoetesakURL(moetesak, getTranslateFunction(languageCode)),
    [languageCode],
  );
}

export function generateFileUrl(dokumentobjekt: Dokumentobjekt): string {
  return `${process.env.API_URL}/dokumentobjekt/${dokumentobjekt.id}/download`;
}
