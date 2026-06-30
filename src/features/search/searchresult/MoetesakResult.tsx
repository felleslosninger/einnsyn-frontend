import type { Moetesak } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import SearchResultSubheader from './common/SearchResultSubheader';

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
    <div className={cn(className, 'search-result', 'moetesak-result')}>
      <EinLink href="">
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div className="ds-paragraph search-result-body" data-size="sm">
        <SearchResultSubheader
          variant="moetesak"
          item={item}
          label={translate('moetesak.label')}
        >
          {item.moetesakssekvensnummer && (
            <span className="search-result-number">
              {translate('common.number')} {item.moetesakssekvensnummer}/
              {item.moetesaksaar}
            </span>
          )}
        </SearchResultSubheader>
        <div className="search-result-enhet">
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
