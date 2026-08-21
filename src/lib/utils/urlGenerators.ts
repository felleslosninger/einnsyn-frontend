import type {
  Dokumentobjekt,
  Enhet,
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import type { TranslateFunction } from '~/lib/translation/translation';

// Slug-first identifier with id fallback, for the entity itself.
function entitySegment(entity: { slug?: string; id: string }): string {
  return entity.slug ?? entity.id;
}

// Identifier for a parent reference, which the API returns either expanded
// (an object — slug-first) or collapsed (just the id string).
function parentSegment(
  parent: { slug?: string; id: string } | string | undefined,
): string {
  if (!parent) return '';
  return typeof parent === 'string' ? parent : (parent.slug ?? parent.id);
}

export function generateSaksmappeURL(
  saksmappe: Saksmappe,
  t: TranslateFunction,
): string {
  return `/${t('routing.saksmappePath')}/${entitySegment(saksmappe)}`;
}

export function generateJournalpostURL(
  journalpost: Journalpost,
  t: TranslateFunction,
): string {
  return `/${t('routing.saksmappePath')}/${parentSegment(journalpost.saksmappe)}/${t('journalpost.pathName')}/${entitySegment(journalpost)}`;
}

export function generateMoetemappeURL(
  moetemappe: Moetemappe,
  t: TranslateFunction,
): string {
  return `/${t('routing.moetemappePath')}/${entitySegment(moetemappe)}`;
}

export function generateMoetesakURL(
  moetesak: Moetesak,
  t: TranslateFunction,
): string {
  return `/${t('routing.moetemappePath')}/${parentSegment(moetesak.moetemappe)}/${t('moetesak.pathName')}/${entitySegment(moetesak)}`;
}

// Hook wrappers for use in client components
export function useSaksmappeURLGenerator() {
  const t = useTranslation();
  return (saksmappe: Saksmappe) => generateSaksmappeURL(saksmappe, t);
}

export function useJournalpostURLGenerator() {
  const t = useTranslation();
  return (journalpost: Journalpost) => generateJournalpostURL(journalpost, t);
}

export function useMoetemappeURLGenerator() {
  const t = useTranslation();
  return (moetemappe: Moetemappe) => generateMoetemappeURL(moetemappe, t);
}

export function useMoetesakURLGenerator() {
  const t = useTranslation();
  return (moetesak: Moetesak) => generateMoetesakURL(moetesak, t);
}

export function generateEnhetUrl(enhet: Enhet): string {
  return `/${enhet.id}`;
}

export function generateFileUrl(dokumentobjekt: Dokumentobjekt): string {
  return `${process.env.API_URL}/dokumentobjekt/${dokumentobjekt.id}/download`;
}
