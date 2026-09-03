import { isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getName } from '~/lib/utils/enhetUtils';
import {
  generateEnhetURL,
  useSaksmappeURLGenerator,
} from '~/lib/utils/urlGenerators';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

export default function SaksmappeResult({
  className,
  item,
}: {
  className?: string;
  item: Saksmappe;
}) {
  const translate = useTranslation();
  const languageCode = useLanguageCode();
  const saksmappeURL = useSaksmappeURLGenerator();
  const enhet = item.administrativEnhetObjekt;

  return (
    <div className={cn(className, styles.searchResult, 'saksmappe-result')}>
      <EinLink href={saksmappeURL(item)}>
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
            <EinLink href={generateEnhetURL(enhet)}>
              {getName(enhet, languageCode)}
            </EinLink>
          </div>
        )}
      </div>
    </div>
  );
}
