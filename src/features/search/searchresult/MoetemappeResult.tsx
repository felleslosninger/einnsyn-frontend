import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';

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
  const enhetNavn = getName(item.utvalgObjekt, languageCode);
  const enhetHref = getEnhetHref(item.utvalgObjekt);

  return (
    <div className={cn(className, 'search-result', 'moetemappe-result')}>
      <EinLink href="">
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div className="ds-paragraph search-result-body" data-size="sm">
        <SearchResultSubheader
          variant="moetemappe"
          item={item}
          label={translate('moetemappe.label')}
        >
          {meetingDate && (
            <span className="search-result-meeting-date">{meetingDate}</span>
          )}
          {item.moetested && (
            <span className="search-result-location">{item.moetested}</span>
          )}
        </SearchResultSubheader>
        <div className="search-result-enhet">
          <EinLink href={enhetHref}>{enhetNavn}</EinLink>
        </div>
        {/* TODO: implement add to calendar functionality
        <EinLink href="" className="search-result-action">
          {translate('search.addToCalendar')}
        </EinLink> */}
      </div>
    </div>
  );
}
