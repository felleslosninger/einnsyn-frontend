import JournalpostContainer from './JournalpostContainer';
import { getApiClient } from '~/actions/api/getApiClient';

export default async function Journalpost({
  params,
}: {
  params: Promise<{ journalpost: string }>;
}) {
  const { journalpost = '' } = await params;

  const apiClient = await getApiClient();

  const journalpostEntity = await apiClient.journalpost.get(journalpost, {
    expand: ['administrativEnhetObjekt'],
  });

  return <JournalpostContainer journalpost={journalpostEntity} />;
}
