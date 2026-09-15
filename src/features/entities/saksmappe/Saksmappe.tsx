import { isEnhet } from '@digdir/einnsyn-sdk';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { getJournalpostWindow } from '~/actions/api/journalpost.actions';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import EnhetCard from '~/features/entities/common/EnhetCard';
import EntityKind from '~/features/entities/common/EntityKind';
import EntityPageLayout from '~/features/entities/common/EntityPageLayout';
import JournalpostList from '~/features/entities/saksmappe/JournalpostList';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';

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
