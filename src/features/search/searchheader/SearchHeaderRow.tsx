import SearchTabs from '~/features/search/searchheader/SearchTabs';

/**
 * The header's second row on the routes that show search results. The search
 * field itself is persistent and lives in the header shell, so this row is all
 * a search route's header slot contributes.
 */
export default function SearchHeaderRow() {
  return <SearchTabs className="header-tabs" />;
}
