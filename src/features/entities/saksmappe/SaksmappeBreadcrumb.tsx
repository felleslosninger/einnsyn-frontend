import { isEnhet } from '@digdir/einnsyn-sdk';
import { getJournalpost } from '~/actions/api/journalpost.actions';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import EinBreadcrumb, {
  type BreadcrumbItem,
} from '~/components/EinBreadcrumb/Breadcrumbs';
import { getTranslateFunction } from '~/lib/translation/translation';
import { getLanguageCode } from '~/lib/translation/translation.actions';
import { getAncestors, getName } from '~/lib/utils/enhetUtils';
import {
  generateEnhetURL,
  generateSaksmappeURL,
} from '~/lib/utils/urlGenerators';

// Server component that builds the saksmappe breadcrumb trail. Used in the
// `@header` slot so the trail sits in the sticky header where search lives on
// other routes. `getSaksmappe` is React-cached, so rendering this alongside the
// saksmappe layout (which also fetches it) costs a single API call per request.
export default async function SaksmappeBreadcrumb({
  saksmappeId,
  journalpostId,
}: {
  saksmappeId: string;
  journalpostId?: string;
}) {
  const [saksmappeEntity, journalpostEntity, languageCode] = await Promise.all([
    getSaksmappe(saksmappeId),
    // Also React-cached: the detail page awaits the same request in this render.
    journalpostId ? getJournalpost(journalpostId).catch(() => null) : null,
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

  // On a journalpost route the saksmappe is an ancestor rather than the current
  // page. The link reuses the route param — a slug/id swap there would remount
  // the layout and cancel the list/detail transition.
  if (journalpostEntity) {
    items.push({
      label: saksmappeLabel,
      href: generateSaksmappeURL(encodeURIComponent(saksmappeId), t),
    });
  }

  return (
    <EinBreadcrumb
      items={items}
      current={
        journalpostEntity
          ? journalpostEntity.offentligTittel || t('journalpost.label')
          : saksmappeLabel
      }
    />
  );
}
