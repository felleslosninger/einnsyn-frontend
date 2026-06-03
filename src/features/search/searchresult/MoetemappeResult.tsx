import { isEnhet, type Moetemappe } from '@digdir/einnsyn-sdk';
import { Buildings3Icon, CalendarIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import EnhetLink from './common/EnhetLink';
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

  const enhetNavn =
    typeof item.utvalgObjekt === 'object' &&
    item.utvalgObjekt &&
    'navn' in item.utvalgObjekt
      ? item.utvalgObjekt.navn
      : '';

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
          <Buildings3Icon
            aria-hidden="true"
            focusable="false"
            fontSize="1.5rem"
          />
          <span>{enhetNavn}</span>
          <span>-</span>
          <span>{item.utvalg}</span>
        </div>
        <EinLink href="" className="search-result-action">
          {translate('search.addToCalendar')}
        </EinLink>
      </div>
    </div>
  );
}
