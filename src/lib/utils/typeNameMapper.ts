import { useTranslation } from '~/hooks/useTranslation';

export function mapJournalpostType(type: string): string {
  const t = useTranslation();
  return t(`journalpost.type.${type}`);
}
