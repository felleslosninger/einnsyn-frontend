import ListPage from '~/features/bruker/ListPage';
import LagretSakList, {
  LagretSakListSkeleton,
} from '~/features/bruker/lagret-sak/LagretSakList';

export default function SavedCasesPage() {
  return (
    <ListPage
      type="savedCases"
      skeleton={<LagretSakListSkeleton />}
      load={(api, brukerId, query) =>
        api.bruker.listLagretSak(brukerId, {
          ...query,
          // The other kind stays an id and is filtered out by the list.
          expand: ['saksmappe.administrativEnhetObjekt'],
        })
      }
    >
      {(page) => <LagretSakList initialPage={page} kind="saksmappe" />}
    </ListPage>
  );
}
