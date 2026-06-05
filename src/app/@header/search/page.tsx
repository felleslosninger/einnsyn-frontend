import SearchHeaderPage, { type HeaderSearchParams } from '../SearchHeaderPage';

export default async function SearchHeader({
  searchParams,
}: Readonly<{
  searchParams: HeaderSearchParams;
}>) {
  return <SearchHeaderPage searchParams={searchParams} />;
}
