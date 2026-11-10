import { isEnhet, type Moetemappe } from '@digdir/einnsyn-sdk';
import { createEvent } from 'ics';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { getEnhetIdentifier, getName } from '~/lib/enhet/enhet';
import { toLocalizedPath } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

function getCalendarHref(item: Moetemappe): string | undefined {
  const date = new Date(item.moetedato);
  if (Number.isNaN(date.getTime())) return undefined;

  const { value } = createEvent({
    title: item.offentligTittel,
    start: [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
    ],
    startInputType: 'utc',
    startOutputType: 'utc',
    duration: { hours: 1 },
    location: item.moetested,
  });

  return value
    ? `data:text/calendar;charset=utf-8,${encodeURIComponent(value)}`
    : undefined;
}

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
  const calendarHref = getCalendarHref(item);
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
          item={item}
          label={translate('moetemappe.label')}
        >
          {meetingDate && <span>{meetingDate}</span>}
          {item.moetested && <span>{item.moetested}</span>}
        </SearchResultSubheader>
        {isEnhet(utvalg) && (
          <div className={styles.searchResultEnhet}>
            <EinLink
              href={toLocalizedPath(
                languageCode,
                '/[enhet]',
                getEnhetIdentifier(utvalg),
              )}
            >
              {getName(utvalg, languageCode)}
            </EinLink>
          </div>
        )}
        {calendarHref && (
          <a
            href={calendarHref}
            download="meeting.ics"
            className={styles.searchResultAction}
          >
            {translate('search.addToCalendar')}
          </a>
        )}
      </div>
    </div>
  );
}
