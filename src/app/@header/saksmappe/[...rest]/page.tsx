import { SaksmappeHeaderRow } from '~/features/entities';
import { getJournalpostFromPath } from '~/lib/routes/sections';

// Header slot for the routes under /saksmappe/* (saksmappe and journalpost).
export default async function SaksmappeHeaderSlot({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;

  return (
    <SaksmappeHeaderRow
      saksmappeId={rest[0]}
      // Matching on the route folder's own name: `rest` only ever reaches this
      // slot via /saksmappe/*, whichever language the incoming URL used.
      journalpostId={getJournalpostFromPath(`/saksmappe/${rest.join('/')}`)}
    />
  );
}
