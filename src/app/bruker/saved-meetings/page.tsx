import ListPage from '~/features/bruker/ListPage';
import LagretSakList, {
  LagretSakListSkeleton,
} from '~/features/bruker/lagret-sak/LagretSakList';

export default function SavedMeetingsPage() {
  return (
    <ListPage
      type="savedMeetings"
      skeleton={<LagretSakListSkeleton />}
      load={(api, brukerId, query) =>
        api.bruker.listLagretSak(brukerId, {
          ...query,
          // The other kind stays an id and is filtered out by the list.
          expand: ['moetemappe.utvalgObjekt'],
        })
      }
    >
      {(page) => <LagretSakList initialPage={page} kind="moetemappe" />}
    </ListPage>
  );
}
