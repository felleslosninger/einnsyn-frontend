import { isEnhet } from '@digdir/einnsyn-sdk';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import EinBreadcrumb, {
  type BreadcrumbItem,
} from '~/components/EinBreadcrumb/Breadcrumbs';
import { getTranslateFunction } from '~/lib/translation/translation';
import { getLanguageCode } from '~/lib/translation/translation.actions';
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
  const [saksmappeEntity, languageCode] = await Promise.all([
    getSaksmappe(saksmappeId),
    getLanguageCode(),
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
