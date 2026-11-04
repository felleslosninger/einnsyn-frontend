'use client';

import { Details, Heading, Skeleton } from '@digdir/designsystemet-react';
import {
  Buildings3Icon,
  ChevronRightIcon,
  EnvelopeClosedIcon,
  LocationPinIcon,
  PhoneIcon,
} from '@navikt/aksel-icons';
import { useCallback, useEffect, useState } from 'react';
import EinChart from '~/components/EinChart/EinChart';
import { EinLink } from '~/components/EinLink/EinLink';
import useBreakpoint from '~/hooks/useBreakpoint';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useSearchHref } from '~/hooks/useSearchHref';
import { useTranslation } from '~/hooks/useTranslation';
import { getAncestors, getEnhetIdentifier, getName } from '~/lib/enhet/enhet';
import type { UpcomingMeeting } from '~/lib/moetemappe/moetemappe.server';
import { buildPathname } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import {
  getNorwegianDate,
  monthFormat,
  relativeDateFormat,
  timeFormat,
  weekdayDateFormat,
} from '~/lib/utils/dateFormat';
import { formatPhoneNumber } from '~/lib/utils/phoneNumber';
import styles from './SelectedEnhetPanel.module.scss';
import {
  getSelectedEnhetsAction,
  type SelectedEnhet,
} from './selectedEnhet.actions';

type LoadedSelection = { enhetIdsKey: string; enhets: SelectedEnhet[] };

// The page remounts when the selection moves an enhet in or out of the path,
// so the selection last loaded, the request a change starts and the selection
// last on screen outlive the panel.
let lastLoaded: (LoadedSelection & { loadedAt: number }) | undefined;
let lastShownKey: string | undefined;
const pendingRequests = new Map<string, Promise<SelectedEnhet[]>>();

// Long enough to bridge a remount, short enough not to hold stale statistics.
const REUSE_LAST_LOADED_MS = 60 * 1000;

function fetchSelectedEnhets(enhetIds: string[], enhetIdsKey: string) {
  let request = pendingRequests.get(enhetIdsKey);
  if (!request) {
    request = getSelectedEnhetsAction(enhetIds)
      .catch((): SelectedEnhet[] => [])
      .finally(() => pendingRequests.delete(enhetIdsKey));
    pendingRequests.set(enhetIdsKey, request);
  }
  return request;
}

/** The meetings grouped by their day in Norway, in order. */
function groupByDay(meetings: UpcomingMeeting[]) {
  const days: { day: string; meetings: UpcomingMeeting[] }[] = [];
  for (const meeting of meetings) {
    const day = getNorwegianDate(meeting.moetedato);
    const lastAdded = days.at(-1);
    if (lastAdded?.day === day) {
      lastAdded.meetings.push(meeting);
    } else {
      days.push({ day, meetings: [meeting] });
    }
  }
  return days;
}

function Meeting({ id, offentligTittel, moetedato, utvalg }: UpcomingMeeting) {
  const languageCode = useLanguageCode();
  // An utvalg's meetings are titled with its name and the date. A meeting
  // held by a whole organisation keeps its title, as the organisation's name
  // wouldn't say which.
  const title =
    utvalg?.enhetstype === 'UTVALG'
      ? getName(utvalg, languageCode)
      : offentligTittel;

  return (
    <li className={styles.meeting}>
      <time dateTime={moetedato} className={styles.meetingTime}>
        {timeFormat(moetedato, languageCode)}
      </time>
      <p className={styles.meetingTitle}>
        {utvalg ? (
          <EinLink
            href={buildPathname(
              {
                enhetIdentifier: getEnhetIdentifier(utvalg),
                moetemappeIdentifier: id,
              },
              languageCode,
            )}
          >
            {title}
          </EinLink>
        ) : (
          title
        )}
      </p>
    </li>
  );
}

function MeetingDay({
  day,
  meetings,
}: {
  day: string;
  meetings: UpcomingMeeting[];
}) {
  const languageCode = useLanguageCode();
  const { moetedato } = meetings[0];

  return (
    <li>
      <h4 className={styles.meetingDayHeading}>
        <strong>{relativeDateFormat(moetedato, languageCode)}</strong> ·{' '}
        <time dateTime={day}>{weekdayDateFormat(moetedato, languageCode)}</time>
      </h4>
      <ol className={styles.meetingList}>
        {meetings.map((meeting) => (
          <Meeting key={meeting.id} {...meeting} />
        ))}
      </ol>
    </li>
  );
}

function UpcomingMeetings({ meetings }: { meetings: UpcomingMeeting[] }) {
  const t = useTranslation();

  return (
    <section className={styles.meetings}>
      <Heading level={3} data-size="2xs" className={styles.meetingsHeading}>
        {t('moetemappe.upcoming')}
      </Heading>
      <ol className={styles.meetingDays}>
        {groupByDay(meetings).map((meetingDay) => (
          <MeetingDay key={meetingDay.day} {...meetingDay} />
        ))}
      </ol>
    </section>
  );
}

function EnhetCard({ enhet, statistics, meetings }: SelectedEnhet) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const searchHref = useSearchHref();
  const ancestors = getAncestors(enhet);
  const phone = enhet.kontaktpunktTelefon
    ? formatPhoneNumber(enhet.kontaktpunktTelefon, languageCode)
    : undefined;

  return (
    <article className={styles.enhetCard}>
      <header>
        {ancestors.length > 0 && (
          <p className={styles.ancestors}>
            {ancestors.map((ancestor) => (
              <span key={ancestor.id} className={styles.ancestor}>
                <EinLink
                  href={searchHref({ enhet: [getEnhetIdentifier(ancestor)] })}
                >
                  {getName(ancestor, languageCode)}
                </EinLink>
                <ChevronRightIcon aria-hidden="true" />
              </span>
            ))}
          </p>
        )}
        <Heading level={2} data-size="xs" className={styles.enhetName}>
          {getName(enhet, languageCode)}
        </Heading>
      </header>
      <address className={styles.contact}>
        {phone && (
          <span className={styles.contactItem}>
            <PhoneIcon aria-hidden="true" />
            <span className="ds-sr-only">{t('common.phone')}: </span>
            {phone.href ? (
              <EinLink href={phone.href}>{phone.text}</EinLink>
            ) : (
              phone.text
            )}
          </span>
        )}
        {enhet.kontaktpunktEpost && (
          <span className={styles.contactItem}>
            <EnvelopeClosedIcon aria-hidden="true" />
            <span className="ds-sr-only">{t('common.email')}: </span>
            <EinLink
              href={`mailto:${enhet.kontaktpunktEpost}`}
              className={styles.email}
            >
              {enhet.kontaktpunktEpost}
            </EinLink>
          </span>
        )}
        {enhet.kontaktpunktAdresse && (
          <span className={styles.contactItem}>
            <LocationPinIcon aria-hidden="true" />
            <span className="ds-sr-only">{t('common.address')}: </span>
            {enhet.kontaktpunktAdresse}
          </span>
        )}
      </address>
      {statistics && (
        <EinChart
          className={styles.statistics}
          caption={t('statistics.last12Months')}
          pointName={t('statistics.month')}
          points={statistics}
          pointLabel={(month, length) =>
            monthFormat(month.time, languageCode, length)
          }
          series={[
            {
              type: 'bar',
              label: t('statistics.documents'),
              value: (month) => month.createdCount,
            },
            {
              type: 'line',
              scale: 'innsynskrav',
              label: t('statistics.innsynskrav'),
              value: (month) => month.createdInnsynskravCount,
            },
          ]}
        />
      )}
      {meetings.length > 0 && <UpcomingMeetings meetings={meetings} />}
    </article>
  );
}

function EnhetCardSkeleton() {
  return (
    <div className={styles.enhetCard}>
      <p className={styles.ancestors}>
        <span>
          <Skeleton variant="text" width={24} />
        </span>
      </p>
      <Heading level={2} data-size="xs" className={styles.enhetName}>
        <Skeleton variant="text" width={14} />
      </Heading>
      <div className={styles.contact}>
        <div>
          <Skeleton variant="text" width={11} />
        </div>
        <div>
          <Skeleton variant="text" width={28} />
        </div>
        <div>
          <Skeleton variant="text" width={24} />
        </div>
      </div>
      <div className={styles.statistics}>
        <Skeleton className={styles.statisticsSkeleton} />
      </div>
    </div>
  );
}

/** The cards fade in, unless the selection was on screen just before. */
function SelectionCards({
  selection,
  isLeaving,
}: {
  selection: LoadedSelection;
  isLeaving: boolean;
}) {
  const [isAppearing, setIsAppearing] = useState(
    () => selection.enhetIdsKey !== lastShownKey,
  );

  return (
    <div
      className={cn({
        [styles.appearing]: isAppearing,
        [styles.leaving]: isLeaving,
      })}
      inert={isLeaving}
      onAnimationEnd={(event) => {
        // The cards animate together, and hidden content doesn't animate, so
        // one card's animation ending means they were all seen.
        if ((event.target as Element).parentElement === event.currentTarget) {
          lastShownKey = selection.enhetIdsKey;
          setIsAppearing(false);
        }
      }}
    >
      {selection.enhets.map((selected) => (
        <EnhetCard key={selected.enhet.id} {...selected} />
      ))}
    </div>
  );
}

export default function SelectedEnhetPanel({
  enhetIds,
}: {
  enhetIds: string[];
}) {
  const t = useTranslation();
  const isLargeScreen = useBreakpoint('LG');
  const enhetIdsKey = enhetIds.join('|');
  const [loadedSelection, setLoadedSelection] = useState<
    LoadedSelection | undefined
  >(() =>
    lastLoaded?.enhetIdsKey === enhetIdsKey &&
    Date.now() - lastLoaded.loadedAt < REUSE_LAST_LOADED_MS
      ? lastLoaded
      : undefined,
  );
  // A request already in flight was started by the panel before a remount,
  // whose cards have faded out; a skeleton would flash in between.
  const [joinsPendingRequest] = useState(() =>
    pendingRequests.has(enhetIdsKey),
  );

  // The sticky offsets depend on the content's height, which CSS can't read.
  // When the scroll direction flips, the spacer moves the content's place in
  // the flow to where it is shown, so tall content scrolls with the page.
  const trackSticky = useCallback((sticky: HTMLElement | null) => {
    const column = sticky?.parentElement;
    if (!sticky || !column) {
      return;
    }

    const observer = new ResizeObserver(() => {
      column.style.setProperty('--panel-height', `${sticky.offsetHeight}px`);
    });
    observer.observe(sticky);

    let lastY = window.scrollY;
    let wasScrollingDown: boolean | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      if (y === lastY) {
        return;
      }
      const isScrollingDown = y > lastY;
      lastY = y;
      if (isScrollingDown !== wasScrollingDown) {
        wasScrollingDown = isScrollingDown;
        const offset =
          sticky.getBoundingClientRect().top -
          column.getBoundingClientRect().top;
        column.style.setProperty('--panel-offset', `${offset}px`);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: enhetIdsKey stands in for enhetIds, which is a new array on every render, and `loadedSelection` only matters when it changes
  useEffect(() => {
    if (loadedSelection?.enhetIdsKey === enhetIdsKey) {
      return;
    }

    let cancelled = false;
    fetchSelectedEnhets(enhetIds, enhetIdsKey).then((enhets) => {
      if (enhets.length > 0) {
        lastLoaded = { enhetIdsKey, enhets, loadedAt: Date.now() };
      }
      if (!cancelled) {
        setLoadedSelection({ enhetIdsKey, enhets });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enhetIdsKey]);

  if (loadedSelection?.enhets.length === 0) {
    return null;
  }

  const isLoading = loadedSelection?.enhetIdsKey !== enhetIdsKey;
  let cards: React.ReactNode = null;
  if (loadedSelection) {
    cards = (
      <SelectionCards
        key={loadedSelection.enhetIdsKey}
        selection={loadedSelection}
        isLeaving={isLoading}
      />
    );
  } else if (!joinsPendingRequest) {
    cards = enhetIds.map((id) => <EnhetCardSkeleton key={id} />);
  }

  return (
    <aside
      className={styles.panel}
      aria-label={t('search.selectedEnheter+')}
      aria-busy={isLoading}
    >
      {isLargeScreen ? (
        <div ref={trackSticky} className={styles.sticky}>
          {cards}
        </div>
      ) : (
        <Details className={styles.details} data-color="neutral" data-size="sm">
          <Details.Summary>
            <Heading level={2} data-size="sm" className={styles.detailsHeading}>
              <Buildings3Icon />
              {t('search.selectedEnheter+')}
            </Heading>
          </Details.Summary>
          <Details.Content>{cards}</Details.Content>
        </Details>
      )}
    </aside>
  );
}
