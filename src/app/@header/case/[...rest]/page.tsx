import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';
import BackToSearchHeader from '~/features/header/BackToSearchHeader';

// Header slot for entity pages under /case/* (saksmappe and journalpost).
// The breadcrumb + back-to-search form the always-visible "chrome" row; below
// them sits the SaksmappeHeader (title / meta / enhet card), which lives in the
// sticky header so it stays fixed on scroll and collapses to a one-line title
// when the header minimizes on scroll-down. `getSaksmappe` is React-cached, so
// fetching it here costs no extra API call beyond the saksmappe layout/breadcrumb.
export default async function CaseHeader({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;
  const saksmappeId = rest[0];
  const saksmappe = await getSaksmappe(saksmappeId);

  return (
    <>
      <BackToSearchHeader />
      <SaksmappeBreadcrumb saksmappeId={saksmappeId} />
      <SaksmappeHeader saksmappe={saksmappe} />
    </>
  );
}
