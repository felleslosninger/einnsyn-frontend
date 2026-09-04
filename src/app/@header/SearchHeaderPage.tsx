import SearchTabs from '~/features/search/searchheader/SearchTabs';

// The header's second row on search routes. The search field itself is rendered
// once by `@header/layout.tsx`, so the slot pages only contribute this row.
export default function SearchHeaderPage() {
  return <SearchTabs className="header-tabs" />;
}
