import InnsynskravList, {
  InnsynskravListSkeleton,
} from '~/features/bruker/access-requests/InnsynskravList';
import ListPage from '~/features/bruker/ListPage';

export default function AccessRequestsPage() {
  return (
    <ListPage
      type="accessRequests"
      skeleton={<InnsynskravListSkeleton />}
      load={(api, brukerId, query) =>
        api.bruker.listInnsynskrav(brukerId, {
          ...query,
          expand: [
            'journalpost.saksmappe',
            'journalpost.administrativEnhetObjekt',
            'journalpost.korrespondansepart',
          ],
        })
      }
    >
      {(page) => <InnsynskravList initialPage={page} />}
    </ListPage>
  );
}
