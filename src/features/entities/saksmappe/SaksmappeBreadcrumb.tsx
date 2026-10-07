import { isEnhet } from '@digdir/einnsyn-sdk';
import EinBreadcrumb, {
  type BreadcrumbItem,
} from '~/components/EinBreadcrumb/Breadcrumbs';
import { getSaksmappe } from '~/features/entities/saksmappe/saksmappe.server';
import { getSettings } from '~/lib/settings/settings.server';
import { getTranslateFunction } from '~/lib/translation/translation';
import { getAncestors, getName } from '~/lib/utils/enhetUtils';
import { generateEnhetURL } from '~/lib/utils/urlGenerators';

// Server component that builds the saksmappe breadcrumb trail. Used in the
// `@header` slot so the trail sits in the sticky header where search lives on
// other routes. `getSaksmappe` is React-cached, so rendering this alongside the
// saksmappe layout (which also fetches it) costs a single API call per request.
//
// The trail ends at the saksmappe on the journalpost routes as well: a
// journalpost opens inline in the case's list rather than as a page of its own.
export default async function SaksmappeBreadcrumb({
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
        href: generateEnhetURL(enhet),
      }))
    : [];

  const saksmappeLabel = `${t('saksmappe.label')} ${saksmappeEntity.saksnummer}`;

  return <EinBreadcrumb items={items} current={saksmappeLabel} />;
}
