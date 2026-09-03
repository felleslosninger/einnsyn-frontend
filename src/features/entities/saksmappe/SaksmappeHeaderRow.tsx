import EntityHeaderBar from '~/features/entities/common/EntityHeaderBar';
import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';

/**
 * The header's second row on a saksmappe's routes: its breadcrumb trail, plus
 * the follow action the bar pins beside it.
 */
export default function SaksmappeHeaderRow({
  saksmappeId,
  journalpostId,
}: {
  saksmappeId: string;
  journalpostId?: string;
}) {
  return (
    <EntityHeaderBar followLabelKey="saksmappe.follow">
      <SaksmappeBreadcrumb
        saksmappeId={saksmappeId}
        journalpostId={journalpostId}
      />
    </EntityHeaderBar>
  );
}
