import SearchHeaderPage, { type HeaderSearchParams } from './SearchHeaderPage';

export default async function EnhetHeader({
  searchParams,
}: Readonly<{
  searchParams: HeaderSearchParams;
}>) {
  return <SearchHeaderPage searchParams={searchParams} />;
}
