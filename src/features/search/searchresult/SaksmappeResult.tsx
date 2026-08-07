import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';

export const getSaksmappeHref = (saksmappe: Saksmappe) => {
  const enhet = saksmappe.administrativEnhetObjekt;

  // Fail gracefully if enhet isn't expanded
  if (typeof enhet === 'string') {
    return '';
  }

  const enhetHref = getEnhetHref(enhet);
  return `${enhetHref}/saksmappe/${saksmappe.id}`;
};

export default function SaksmappeResult({
  className,
  item,
}: {
  className?: string;
  item: Saksmappe;
}) {
  const translate = useTranslation();
  const languageCode = useLanguageCode();
  const saksmappeHref = getSaksmappeHref(item);
  const enhet = item.administrativEnhetObjekt;
  const enhetNavn = getName(enhet, languageCode);
  const enhetHref = getEnhetHref(enhet);

  return (
    <div className={cn(className, 'search-result', 'saksmappe-result')}>
      <EinLink href={saksmappeHref}>
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div className="ds-paragraph search-result-body" data-size="sm">
        <SearchResultSubheader
          variant="saksmappe"
          item={item}
          label={translate('saksmappe.label')}
        >
          {item.saksnummer && (
            <span className="search-result-number">
              {translate('common.number')} {item.saksnummer}
            </span>
          )}
        </SearchResultSubheader>
        {isEnhet(enhet) && (
          <div className="search-result-enhet">
            <EinLink href={enhetHref}>{enhetNavn}</EinLink>
          </div>
        )}
      </div>
    </div>
  );
}
