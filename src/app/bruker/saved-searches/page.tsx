import ListPage from '~/features/bruker/ListPage';
import LagretSoekList, {
  LagretSoekListSkeleton,
} from '~/features/bruker/saved-searches/LagretSoekList';

export default function SavedSearchesPage() {
  return (
    <ListPage
      type="savedSearches"
      skeleton={<LagretSoekListSkeleton />}
      load={(api, brukerId, query) =>
        api.bruker.listLagretSoek(brukerId, query)
      }
    >
      {(page) => <LagretSoekList initialPage={page} />}
    </ListPage>
  );
}
