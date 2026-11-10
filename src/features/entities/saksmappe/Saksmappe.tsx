import EntityKind from '~/features/entities/common/EntityKind';
import EntityPageLayout from '~/features/entities/common/EntityPageLayout';
import { getJournalpostWindow } from '~/features/entities/journalpost/journalpost.server';
import JournalpostList from '~/features/entities/saksmappe/JournalpostList';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';
import { getSaksmappe } from '~/features/entities/saksmappe/saksmappe.server';

/**
 * A saksmappe page: its header in the shared entity layout's sidebar, with
 * the journalpost list beside it and the open journalpost (`children`)
 * rendered inside the list.
 *
 * `activeJournalpost` centers the list's first window on a deep-linked
 * journalpost; without one the window starts at the newest entry.
 */
export default async function Saksmappe({
  saksmappeId,
  activeJournalpost,
  children,
}: {
  saksmappeId: string;
  activeJournalpost?: string;
  children: React.ReactNode;
}) {
  const [saksmappe, journalposts] = await Promise.all([
    getSaksmappe(saksmappeId),
    getJournalpostWindow(saksmappeId, activeJournalpost),
  ]);

  return (
    <EntityPageLayout
      kind={<EntityKind entity={saksmappe} />}
      sidebar={<SaksmappeHeader saksmappe={saksmappe} />}
    >
      <JournalpostList journalposts={journalposts} saksmappe={saksmappe}>
        {children}
      </JournalpostList>
    </EntityPageLayout>
  );
}
