import { SaksmappeHeaderRow } from '~/features/entities';

// Header slot for the routes under /saksmappe/* (saksmappe and journalpost).
export default async function SaksmappeHeaderSlot({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;

  // The trail ends at the saksmappe on the journalpost routes too, so only
  // the first segment matters here.
  return <SaksmappeHeaderRow saksmappeId={rest[0]} />;
}
