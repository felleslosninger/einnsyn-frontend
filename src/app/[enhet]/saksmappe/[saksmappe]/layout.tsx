import { Saksmappe } from '~/features/entities';
import { parsePathname } from '~/lib/routing/pathname';
import { getRequestPathname } from '~/lib/routing/requestPath.server';

// The saksmappe page is rendered from a layout rather than a page so that
// JournalpostList stays a single mounted instance across the index <-> detail
// navigation.
export default async function SaksmappeLayout({
  params,
  children,
}: {
  params: Promise<{ saksmappe: string }>;
  children: React.ReactNode;
}) {
  // A layout receives neither params nor searchParams, so the saksmappe and
  // journalpostIdentifier the request is scoped to is recovered from the request URL.
  const [{ saksmappe = '' }, pathname] = await Promise.all([
    params,
    getRequestPathname(),
  ]);
  const journalpostIdentifier = parsePathname(pathname)?.journalpostIdentifier;

  return (
    <Saksmappe
      saksmappeId={saksmappe}
      activeJournalpost={journalpostIdentifier}
    >
      {children}
    </Saksmappe>
  );
}
