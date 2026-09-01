import EntityHeaderBar from '~/features/entities/common/EntityHeaderBar';
import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';

// Header slot for entity pages under /saksmappe/* (saksmappe and journalpost).
export default async function CaseHeader({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;
  const saksmappeId = rest[0];

  return (
    <EntityHeaderBar followLabelKey="saksmappe.follow">
      <SaksmappeBreadcrumb saksmappeId={saksmappeId} />
    </EntityHeaderBar>
  );
}
