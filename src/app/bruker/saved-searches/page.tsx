import SavedSearches from '~/features/bruker/saved-searches/SavedSearches';

export default function SavedSearchesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  return <SavedSearches searchParams={searchParams} />;
}
