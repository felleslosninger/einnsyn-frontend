import { isEnhet, type Moetesak } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import { useMoetesakURLGenerator } from '~/lib/utils/urlGenerators';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

export default function MoetesakResult({
  className,
  item,
}: {
  className?: string;
  item: Moetesak;
}) {
  const translate = useTranslation();
  const languageCode = useLanguageCode();
  const moetesakURL = useMoetesakURLGenerator();
  const utvalg = item.utvalgObjekt;

  return (
    <div className={cn(className, styles.searchResult, 'moetesak-result')}>
      <EinLink href={moetesakURL(item)}>
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div
        className={cn('ds-paragraph', styles.searchResultBody)}
        data-size="sm"
      >
        <SearchResultSubheader
          variant="moetesak"
          item={item}
          label={translate('moetesak.label')}
        >
          {item.moetesakssekvensnummer && (
            <span>
              {translate('common.number')} {item.moetesakssekvensnummer}/
              {item.moetesaksaar}
            </span>
          )}
        </SearchResultSubheader>
        {isEnhet(utvalg) && (
          <div className={styles.searchResultEnhet}>
            <EinLink href={getEnhetHref(utvalg)}>
              {getName(utvalg, languageCode)}
            </EinLink>
          </div>
        )}
      </div>
    </div>
  );
}
