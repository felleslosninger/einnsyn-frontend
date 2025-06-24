import SaksmappeContainer from './SaksmappeContainer';
import { getApiClient } from '~/actions/api/getApiClient';

export default async function Saksmappe({
  params,
}: {
  params: Promise<{ saksmappe: string }>;
}) {
  const { saksmappe = '' } = await params;

  const apiClient = await getApiClient();

  const saksmappeEntity = await apiClient.saksmappe.get(saksmappe, {
    expand: ['administrativEnhetObjekt'],
  });

  const journalpostList = await apiClient.saksmappe.listJournalpost(saksmappe, {
    sortOrder: 'asc',
    id: '',
    saksmappeId: '',
  });

  return (
    <SaksmappeContainer
      saksmappe={saksmappeEntity}
      journalpostList={journalpostList}
    />
  );
}
