import { JournalpostDetail } from '~/features/entities';

// Detail route: supplies only the detail content. The layout passes it into
// JournalpostList (which owns the list) as children, so the list instance is
// preserved across open/close.
export default async function Journalpost({
  params,
}: {
  params: Promise<{ saksmappe: string; journalpost: string }>;
}) {
  const { journalpost = '' } = await params;

  return <JournalpostDetail journalpostId={journalpost} />;
}
