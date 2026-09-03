import EntityHeaderBar from '~/features/entities/common/EntityHeaderBar';
import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';
import { getJournalpostFromPath } from '~/lib/routes/sections';

// Header slot for entity pages under /saksmappe/* (saksmappe and journalpost).
export default async function CaseHeader({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;
  const saksmappeId = rest[0];
  // Matching on the route folder's own name: `rest` only ever reaches this slot
  // via /saksmappe/*, whichever language the incoming URL used.
  const journalpostId = getJournalpostFromPath(`/saksmappe/${rest.join('/')}`);

  return (
    <EntityHeaderBar followLabelKey="saksmappe.follow">
      <SaksmappeBreadcrumb
        saksmappeId={saksmappeId}
        journalpostId={journalpostId}
      />
    </EntityHeaderBar>
  );
}
