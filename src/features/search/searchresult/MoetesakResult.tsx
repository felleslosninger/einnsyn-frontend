import type { Moetesak } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
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
  const enhetNavn =
    typeof item.utvalgObjekt === 'object' &&
    item.utvalgObjekt &&
    'navn' in item.utvalgObjekt
      ? item.utvalgObjekt.navn
      : '';

  return (
    <div className={cn(className, styles.searchResult, 'moetesak-result')}>
      <EinLink href="">
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
            <span className={styles.searchResultNumber}>
              {translate('common.number')} {item.moetesakssekvensnummer}/
              {item.moetesaksaar}
            </span>
          )}
        </SearchResultSubheader>
        <div className={styles.searchResultEnhet}>
          <Buildings3Icon
            aria-hidden="true"
            focusable="false"
            fontSize="1.5rem"
          />
          <span>{enhetNavn}</span>
          <span>-</span>
          <span>{item.utvalg}</span>
        </div>
      </div>
    </div>
  );
}
