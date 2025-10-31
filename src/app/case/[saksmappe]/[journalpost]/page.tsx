import { cachedApiClient } from '~/actions/api/getApiClient';
import JournalpostContainer from './JournalpostContainer';

export default async function Journalpost({
  params,
}: {
  params: Promise<{ journalpost: string }>;
}) {
  const { journalpost = '' } = await params;

  const apiClient = await cachedApiClient();

  const journalpostEntity = await apiClient.journalpost.get(journalpost, {
    expand: [
      'administrativEnhetObjekt',
      'saksmappe',
      'dokumentbeskrivelse.dokumentobjekt',
      'korrespondansepart',
    ],
  });

  return <JournalpostContainer journalpost={journalpostEntity} />;
}
