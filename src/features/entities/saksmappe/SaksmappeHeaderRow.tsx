import FollowLink from '~/features/entities/common/FollowLink';
import SaksmappeBreadcrumb from '~/features/entities/saksmappe/SaksmappeBreadcrumb';
import HeaderBar from '~/features/header/HeaderBar';

/**
 * The header's second row on a saksmappe's routes: its breadcrumb trail, plus
 * the follow action pinned beside it.
 */
export default function SaksmappeHeaderRow({
  saksmappeId,
}: {
  saksmappeId: string;
}) {
  return (
    <HeaderBar end={<FollowLink labelKey="saksmappe.follow" />}>
      <SaksmappeBreadcrumb saksmappeId={saksmappeId} />
    </HeaderBar>
  );
}
