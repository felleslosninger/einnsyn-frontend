import { isEnhet } from '@digdir/einnsyn-sdk';
import EnhetCard from '~/features/entities/common/EnhetCard';
import EntityKind from '~/features/entities/common/EntityKind';
import EntityPageLayout from '~/features/entities/common/EntityPageLayout';
import { getJournalpostWindow } from '~/features/entities/journalpost/journalpost.server';
import JournalpostList from '~/features/entities/saksmappe/JournalpostList';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';
import { getSaksmappe } from '~/features/entities/saksmappe/saksmappe.server';
import { cachedApiClient } from '~/lib/api/api.server';

/**
 * A saksmappe page: its header and publisher card in the shared entity
 * layout, with the journalpost list below them and the open journalpost
 * (`children`) rendered inside the list.
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
  const apiClient = await cachedApiClient();
  const [saksmappe, journalposts] = await Promise.all([
    getSaksmappe(saksmappeId),
    activeJournalpost
      ? getJournalpostWindow(saksmappeId, activeJournalpost)
      : apiClient.saksmappe.listJournalpost(saksmappeId, {
          sortOrder: 'desc',
          id: '',
          saksmappeId: '',
          expand: [
            'skjerming',
            'korrespondansepart',
            'dokumentbeskrivelse.dokumentobjekt',
          ],
        }),
  ]);

  const administrativEnhet = saksmappe.administrativEnhetObjekt;
  const enhet = isEnhet(administrativEnhet) ? administrativEnhet : undefined;

  return (
    <EntityPageLayout
      kind={<EntityKind entity={saksmappe} />}
      header={<SaksmappeHeader saksmappe={saksmappe} />}
      card={
        enhet && <EnhetCard enhet={enhet} headingKey="saksmappe.publishedBy" />
      }
    >
      <JournalpostList journalposts={journalposts} saksmappe={saksmappe}>
        {children}
      </JournalpostList>
    </EntityPageLayout>
  );
}
