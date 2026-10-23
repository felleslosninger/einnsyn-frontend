import type {
  Dokumentobjekt,
  Enhet,
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { useCallback } from 'react';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { getEnhetIdentifier } from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import type { LanguageCode } from '~/lib/translation/translation';

// The identifier a reference contributes to a URL: the entity's slug, or its
// id when it has none. A collapsed reference is the bare id already.
function identifier(reference: { slug?: string; id: string } | string): string {
  return typeof reference === 'string'
    ? reference
    : (reference.slug ?? reference.id);
}

function enhetIdentifier(enhet: Enhet | string): string {
  return typeof enhet === 'string' ? enhet : getEnhetIdentifier(enhet);
}

/** The identifiers of a saksmappe's route, as {@link buildPathname} takes them. */
export function getSaksmappeRoute(saksmappe: Saksmappe) {
  return {
    enhetIdentifier: enhetIdentifier(saksmappe.administrativEnhetObjekt),
    saksmappeIdentifier: identifier(saksmappe),
  };
}

export function generateSaksmappeURL(
  saksmappe: Saksmappe,
  languageCode: LanguageCode,
): string {
  return buildPathname(getSaksmappeRoute(saksmappe), languageCode);
}

/**
 * Below its saksmappe, scoped to the journalpost's own enhet. `''` without
 * either.
 */
export function generateJournalpostURL(
  journalpost: Journalpost,
  languageCode: LanguageCode,
): string {
  const { administrativEnhetObjekt: enhet, saksmappe } = journalpost;
  if (!enhet || !saksmappe) {
    return '';
  }

  return buildPathname(
    {
      enhetIdentifier: enhetIdentifier(enhet),
      saksmappeIdentifier: identifier(saksmappe),
      journalpostIdentifier: identifier(journalpost),
    },
    languageCode,
  );
}

export function generateMoetemappeURL(
  moetemappe: Moetemappe,
  languageCode: LanguageCode,
): string {
  return buildPathname(
    {
      enhetIdentifier: enhetIdentifier(moetemappe.utvalgObjekt),
      moetemappeIdentifier: identifier(moetemappe),
    },
    languageCode,
  );
}

/** Below its moetemappe. `''` without one. */
export function generateMoetesakURL(
  moetesak: Moetesak,
  languageCode: LanguageCode,
): string {
  if (!moetesak.moetemappe) {
    return '';
  }

  return buildPathname(
    {
      enhetIdentifier: enhetIdentifier(moetesak.utvalgObjekt),
      moetemappeIdentifier: identifier(moetesak.moetemappe),
      moetesakIdentifier: identifier(moetesak),
    },
    languageCode,
  );
}

/**
 * The file behind a dokumentobjekt, served by the API. Cross-origin, so render
 * it as a plain `<a>`: `EinLink` hands it to `useNavigation`, which keeps only
 * the path and would send it to this app's origin.
 */
export function generateFileURL(
  dokumentobjekt: Dokumentobjekt,
  apiUrl: string,
): string {
  return `${apiUrl}/dokumentobjekt/${dokumentobjekt.id}/download`;
}

export function useFileURLGenerator() {
  const { apiUrl } = useSessionData();
  return useCallback(
    (dokumentobjekt: Dokumentobjekt) => generateFileURL(dokumentobjekt, apiUrl),
    [apiUrl],
  );
}
