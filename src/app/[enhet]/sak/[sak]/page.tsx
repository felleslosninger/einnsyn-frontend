import { getApiClient } from '~/actions/api/getApiClient';

export default async function Sak({
  params,
}: {
  params: Promise<{ enhet: string; sak: string }>;
}) {
  const { sak: sakSlug, enhet: enhetSlug } = await params;
  const apiClient = await getApiClient();

  const [sak, journalpostList] = await Promise.all([
    apiClient.saksmappe.get(sakSlug, { expand: ['enhet'] }),
    apiClient.saksmappe.listJournalpost(sakSlug),
  ]);

  return <div>Sak</div>;
}
