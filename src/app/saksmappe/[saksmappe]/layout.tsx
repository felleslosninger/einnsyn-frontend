import { Saksmappe } from '~/features/entities';
import { getRequestPathname } from '~/lib/routes/requestPath';
import { getJournalpostFromPath } from '~/lib/routes/sections';

// The saksmappe page is rendered from a layout rather than a page so that
// JournalpostList stays a single mounted instance across the index <-> detail
// navigation —
// that's what lets the detail pane's open/close transition run to completion
// instead of being canceled by a remount.
//
// A layout can't read its child segment's `journalpost` param, so the active
// journalpost is recovered from the request pathname. This only runs on the
// initial server render; the layout is reused across client navigations within
// the saksmappe.
export default async function SaksmappeLayout({
  params,
  children,
}: {
  params: Promise<{ saksmappe: string }>;
  children: React.ReactNode;
}) {
  const [{ saksmappe = '' }, pathname] = await Promise.all([
    params,
    getRequestPathname(),
  ]);

  return (
    <Saksmappe
      saksmappeId={saksmappe}
      activeJournalpost={getJournalpostFromPath(pathname)}
    >
      {children}
    </Saksmappe>
  );
}
