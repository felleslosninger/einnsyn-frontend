import { isEnhet } from '@digdir/einnsyn-sdk';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import EinBreadcrumb, {
  type BreadcrumbItem,
} from '~/components/EinBreadcrumb/Breadcrumbs';
import { getLanguageCode } from '~/lib/translation/translation.actions';
import { getAncestors, getEnhetHref, getName } from '~/lib/utils/enhetUtils';

// Server component that builds the saksmappe breadcrumb trail. Used in the
// `@header` slot so the trail sits in the sticky header where search lives on
// other routes. `getSaksmappe` is React-cached, so rendering this alongside the
// saksmappe layout (which also fetches it) costs a single API call per request.
export default async function SaksmappeBreadcrumb({
  saksmappeId,
}: {
  saksmappeId: string;
}) {
  const [saksmappeEntity, languageCode] = await Promise.all([
    getSaksmappe(saksmappeId),
    getLanguageCode(),
  ]);

  const leafEnhet = saksmappeEntity.administrativEnhetObjekt;
  const items: BreadcrumbItem[] = isEnhet(leafEnhet)
    ? [...getAncestors(leafEnhet), leafEnhet].map((enhet) => ({
        label: getName(enhet, languageCode),
        href: `/${getEnhetHref(enhet)}`,
      }))
    : [];

  return (
    <EinBreadcrumb
      items={items}
      current={`Sak ${saksmappeEntity.saksnummer}`}
    />
  );
}
