import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { buildPathname } from '~/lib/routing/pathname';
import type { LanguageCode } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { getEnhetIdentifier, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

export const getSaksmappeHref = (
  saksmappe: Saksmappe,
  languageCode: LanguageCode,
) => {
  const enhet = saksmappe.administrativEnhetObjekt;

  // Fail gracefully if enhet isn't expanded
  if (typeof enhet === 'string') {
    return '';
  }

  return buildPathname(
    {
      enhetIdentifier: getEnhetIdentifier(enhet),
      saksmappeIdentifier: saksmappe.id,
    },
    languageCode,
  );
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
  const saksmappeHref = getSaksmappeHref(item, languageCode);
  const enhet = item.administrativEnhetObjekt;

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
            <EinLink
              href={buildPathname(
                { enhetIdentifier: getEnhetIdentifier(enhet) },
                languageCode,
              )}
            >
              {getName(enhet, languageCode)}
            </EinLink>
          </div>
        )}
      </div>
    </div>
  );
}
