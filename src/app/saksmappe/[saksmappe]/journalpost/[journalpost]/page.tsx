import { getJournalpost } from '~/actions/api/journalpost.actions';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';

// Detail route: supplies only the detail content. The layout passes it into
// JournalpostList (which owns the list) as children, so the list instance is
// preserved across open/close.
export default async function Journalpost({
  params,
}: {
  params: Promise<{ saksmappe: string; journalpost: string }>;
}) {
  const { journalpost = '' } = await params;
  const active = await getJournalpost(journalpost).catch(() => null);

  return <JournalpostContainer journalpost={active} />;
}
