import { headers } from 'next/headers';
import { cachedApiClient } from '~/actions/api/getApiClient';
import { getJournalpostWindow } from '~/actions/api/journalpost.actions';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import JournalpostList from '~/features/entities/saksmappe/JournalpostList';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';

export default async function SaksmappeLayout({
  params,
  children,
}: {
  params: Promise<{ saksmappe: string }>;
  children: React.ReactNode;
}) {
  const { saksmappe = '' } = await params;

  // JournalpostList lives here (not in the page) so it stays a single mounted
  // instance across the index <-> detail navigation — that's what lets the
  // detail pane's open/close transition run to completion instead of being
  // canceled by a remount.
  //
  // A layout can't read its child segment's `journalpost` param, so we center
  // the list window on a deep link by reading the request pathname (exposed by
  // middleware). This only runs on the initial server render; the layout is
  // reused across client navigations within the saksmappe.
  const pathname = (await headers()).get('x-pathname') ?? '';
  const activeJournalpost = pathname.match(/\/journalpost\/([^/?#]+)/)?.[1];

  const apiClient = await cachedApiClient();
  const [saksmappeEntity, journalposts] = await Promise.all([
    getSaksmappe(saksmappe),
    activeJournalpost
      ? getJournalpostWindow(saksmappe, activeJournalpost)
      : apiClient.saksmappe.listJournalpost(saksmappe, {
          sortOrder: 'desc',
          id: '',
          saksmappeId: '',
          expand: ['skjerming', 'korrespondansepart'],
        }),
  ]);

  return (
    <div className="container-wrapper">
      <div className="container-pre collapsible" />
      <div className="container">
        <SaksmappeHeader saksmappe={saksmappeEntity} />
        <JournalpostList
          journalposts={journalposts}
          saksmappe={saksmappeEntity}
        >
          {children}
        </JournalpostList>
      </div>
      <div className="container-post" />
    </div>
  );
}
