import { isEnhet } from '@digdir/einnsyn-sdk';
import { getSaksmappe } from '~/actions/api/saksmappe.actions';
import type { BreadcrumbItem } from '~/components/EinBreadcrumb/Breadcrumbs';
import SaksmappeBreadcrumbClient from '~/features/entities/saksmappe/SaksmappeBreadcrumbClient';
import SaksmappeHeader from '~/features/entities/saksmappe/SaksmappeHeader';
import BackToSearchHeader from '~/features/header/BackToSearchHeader';
import {
  getLanguageCode,
  getTranslator,
} from '~/lib/translation/translation.actions';
import { getAncestors, getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import { generateSaksmappeURL } from '~/lib/utils/urlGenerators';

// Header slot for entity pages under /case/* (saksmappe and journalpost).
// The breadcrumb + back-to-search form the always-visible "chrome" row; below
// them sits the SaksmappeHeader (kind / title / meta / enhet card), which lives
// in the sticky header so it stays fixed on scroll. It has two poses: full height
// until the page scrolls past the measured body height, then compact in one
// transition (see useHeaderCollapse). The whole body collapses — the title
// included; the title reappears as a link in the breadcrumb, whose trailing crumb
// morphs on the same signal, which is why the breadcrumb is a client component
// fed from here. `getSaksmappe` is React-cached, so fetching it here costs no
// extra API call beyond the saksmappe layout's own fetch.
export default async function CaseHeader({
  params,
}: Readonly<{
  params: Promise<{ rest: string[] }>;
}>) {
  const { rest } = await params;
  const saksmappeId = rest[0];

  const [saksmappe, languageCode, t] = await Promise.all([
    getSaksmappe(saksmappeId),
    getLanguageCode(),
    getTranslator(),
  ]);

  const leafEnhet = saksmappe.administrativEnhetObjekt;
  const ancestors: BreadcrumbItem[] = isEnhet(leafEnhet)
    ? [...getAncestors(leafEnhet), leafEnhet].map((enhet) => ({
        label: getName(enhet, languageCode),
        href: `/${getEnhetHref(enhet)}`,
      }))
    : [];

  return (
    <>
      <BackToSearchHeader />
      <SaksmappeBreadcrumbClient
        ancestors={ancestors}
        saksLabel={`${t('saksmappe.label')} ${saksmappe.saksnummer}`}
        title={saksmappe.offentligTittel}
        href={generateSaksmappeURL(saksmappe, t)}
      />
      <SaksmappeHeader saksmappe={saksmappe} />
    </>
  );
}
