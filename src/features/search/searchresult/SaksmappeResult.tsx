import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

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
    <div className={cn(className, styles.searchResult, 'saksmappe-result')}>
      <EinLink href={saksmappeHref}>
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div
        className={cn('ds-paragraph', styles.searchResultBody)}
        data-size="sm"
      >
        <SearchResultSubheader
          variant="saksmappe"
          item={item}
          label={translate('saksmappe.label')}
        >
          {item.saksnummer && (
            <span>
              {translate('common.number')} {item.saksnummer}
            </span>
          )}
        </SearchResultSubheader>
        {isEnhet(enhet) && (
          <div className={styles.searchResultEnhet}>
            <EinLink href={enhetHref}>{enhetNavn}</EinLink>
          </div>
        )}
      </div>
    </div>
  );
}
