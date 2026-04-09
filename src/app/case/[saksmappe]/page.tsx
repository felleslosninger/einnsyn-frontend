import { cachedApiClient } from '~/actions/api/getApiClient';
import SaksmappeContainer from '~/features/entities/saksmappe/SaksmappeContainer';

export default async function Saksmappe({
  params,
}: {
  params: Promise<{ saksmappe: string }>;
}) {
  const { saksmappe = '' } = await params;

  const apiClient = await cachedApiClient();

  const saksmappeEntity = await apiClient.saksmappe.get(saksmappe, {
    expand: ['administrativEnhetObjekt'],
  });
  // TODO: Change to a search so that we can sort on any column
  const journalpostList = await apiClient.saksmappe.listJournalpost(saksmappe, {
    sortOrder: 'desc',
    id: '',
    saksmappeId: '',
    expand: ['skjerming', 'korrespondansepart.administrativEnhetObjekt'],
  });

  // Search is currently lacking the desired sorting parameters...
  // const otherJpList = (await apiClient.search.search({
  //   entity: ['Journalpost'],
  //   sortOrder: 'desc',
  //   sortBy: 'publisertDato',
  //   administrativEnhet: [
  //     isEnhet(saksmappeEntity.administrativEnhetObjekt)
  //       ? saksmappeEntity.administrativEnhetObjekt.id
  //       : '',
  //   ],
  //   saksnummer: [saksmappeEntity.saksnummer],
  //   expand: ['skjerming', 'korrespondansepart.administrativEnhetObjekt'],
  // })) as PaginatedList<Journalpost>;

  return (
    <SaksmappeContainer
      saksmappe={saksmappeEntity}
      journalpostList={journalpostList}
    />
  );
}
