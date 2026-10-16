import { isEnhet } from '@digdir/einnsyn-sdk';
import FollowLink from '~/features/entities/common/FollowLink';
import { getSaksmappe } from '~/features/entities/saksmappe/saksmappe.server';
import HeaderBar from '~/features/header/HeaderBar';
import HeaderBreadcrumbs, {
  type BreadcrumbItem,
} from '~/features/header/HeaderBreadcrumbs';
import { getAncestors, getEnhetIdentifier, getName } from '~/lib/enhet/enhet';
import { buildPathname } from '~/lib/routing/pathname';
import { getSettings } from '~/lib/settings/settings.server';
import { getTranslateFunction } from '~/lib/translation/translation';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

/**
 * The header's second row on a saksmappe's routes: its breadcrumb trail, plus
 * the follow action pinned beside it.
 *
 * `getSaksmappe` is React-cached, so this shares the saksmappe layout's fetch.
 * The trail ends at the saksmappe on journalpost routes too: a journalpost
 * opens inline in the case's list, not as a page of its own.
 */
export default async function SaksmappeHeaderRow({
  saksmappeId,
}: {
  saksmappeId: string;
}) {
  const [saksmappeEntity, { language: languageCode }] = await Promise.all([
    getSaksmappe(saksmappeId),
    getSettings(),
  ]);
  const t = getTranslateFunction(languageCode);

  const leafEnhet = saksmappeEntity.administrativEnhetObjekt;
  const items: BreadcrumbItem[] = isEnhet(leafEnhet)
    ? [...getAncestors(leafEnhet), leafEnhet].map((enhet) => ({
        label: getName(enhet, languageCode),
        href: buildPathname(
          { enhetIdentifier: getEnhetIdentifier(enhet) },
          languageCode,
        ),
      }))
    : [];

  const current: BreadcrumbItem = {
    label: `${t('saksmappe.label')} ${saksmappeEntity.saksnummer}`,
    href: generateSaksmappeURL(saksmappeEntity, languageCode),
  };

  return (
    <HeaderBar end={<FollowLink labelKey="saksmappe.follow" />}>
      <HeaderBreadcrumbs items={items} current={current} />
    </HeaderBar>
  );
}
