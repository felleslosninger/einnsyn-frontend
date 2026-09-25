import { getJournalpost } from '~/actions/api/journalpost.actions';
import JournalpostContainer from '~/features/entities/journalpost/JournalpostContainer';

/**
 * A single journalpost, as shown in a saksmappe's detail pane. One that fails
 * to load becomes the container's not-found state rather than a page error —
 * the list around it is still valid.
 */
export default async function JournalpostDetail({
  journalpostId,
}: {
  journalpostId: string;
}) {
  const journalpost = await getJournalpost(journalpostId).catch(() => null);

  return <JournalpostContainer journalpost={journalpost} />;
}
