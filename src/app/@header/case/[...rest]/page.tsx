import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';
import BackToSearchHeader from '~/features/header/BackToSearchHeader';

// Header slot for entity pages under /case/* (saksmappe and journalpost).
// Instead of the search field, these routes show the saksmappe breadcrumb
// trail in the header. The first path segment is the saksmappe id.
export default async function CaseHeader({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;
  const saksmappeId = rest[0];

  return (
    <>
      <BackToSearchHeader />
      <SaksmappeBreadcrumb saksmappeId={saksmappeId} />
    </>
  );
}
