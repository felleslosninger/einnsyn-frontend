import SearchHeaderPage, { type HeaderSearchParams } from '../SearchHeaderPage';

export default async function EnhetHeader({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ enhet?: string }>;
  searchParams: HeaderSearchParams;
}>) {
  const { enhet } = await params;

  return <SearchHeaderPage pathEnhet={enhet} searchParams={searchParams} />;
}
