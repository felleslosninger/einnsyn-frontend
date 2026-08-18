import { isEnhet, type Moetemappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

export default function MoetemappeResult({
  className,
  item,
}: {
  className?: string;
  item: Moetemappe;
}) {
  const translate = useTranslation();
  const languageCode = useLanguageCode();
  const meetingDate = item.moetedato
    ? dateFormat(item.moetedato, languageCode)
    : undefined;
  const utvalg = item.utvalgObjekt;

  return (
    <div className={cn(className, styles.searchResult, 'moetemappe-result')}>
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
          variant="moetemappe"
          item={item}
          label={translate('moetemappe.label')}
        >
          {meetingDate && <span>{meetingDate}</span>}
          {item.moetested && <span>{item.moetested}</span>}
        </SearchResultSubheader>
        {isEnhet(utvalg) && (
          <div className={styles.searchResultEnhet}>
            <EinLink href={getEnhetHref(utvalg)}>
              {getName(utvalg, languageCode)}
            </EinLink>
          </div>
        )}
        {/* TODO: implement add to calendar functionality
        <EinLink href="" className={styles.searchResultAction}>
          {translate('search.addToCalendar')}
        </EinLink> */}
      </div>
    </div>
  );
}
