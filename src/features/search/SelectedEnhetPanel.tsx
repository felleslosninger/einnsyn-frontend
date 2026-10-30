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
import cn from '~/lib/utils/className';
import { monthFormat } from '~/lib/utils/dateFormat';
import { formatPhoneNumber } from '~/lib/utils/phoneNumber';
import styles from './SelectedEnhetPanel.module.scss';
import { getSelectedEnhets, type SelectedEnhet } from './search.actions';

type Selection = { key: string; enhets: SelectedEnhet[] };

// The page remounts when the selection moves an enhet in or out of the path,
// so the latest selection, the request a change starts and the selection last
// on screen outlive the panel.
let latest: (Selection & { at: number }) | undefined;
let shownKey: string | undefined;
const requests = new Map<string, Promise<SelectedEnhet[]>>();

// Long enough to bridge a remount, short enough not to hold stale statistics.
const REUSE_LATEST_MS = 60 * 1000;

function requestSelection(enhetIds: string[], key: string) {
  let request = requests.get(key);
  if (!request) {
    request = getSelectedEnhets(enhetIds)
      .catch((): SelectedEnhet[] => [])
      .finally(() => requests.delete(key));
    requests.set(key, request);
  }
  return request;
}

function EnhetCard({ enhet, statistics }: SelectedEnhet) {
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
            monthFormat(month.month, languageCode, length)
          }
          series={[
            {
              type: 'bar',
              label: t('statistics.documents'),
              value: (month) => month.documents,
            },
            {
              type: 'line',
              scale: 'innsynskrav',
              label: t('statistics.innsynskrav'),
              value: (month) => month.innsynskrav,
            },
          ]}
        />
      )}
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
  leaving,
}: {
  selection: Selection;
  leaving: boolean;
}) {
  const [appearing, setAppearing] = useState(() => selection.key !== shownKey);

  return (
    <div
      className={cn({
        [styles.appearing]: appearing,
        [styles.leaving]: leaving,
      })}
      onAnimationEnd={(event) => {
        // The cards animate together, and hidden content doesn't animate, so
        // one card's animation ending means they were all seen.
        if ((event.target as Element).parentElement === event.currentTarget) {
          shownKey = selection.key;
          setAppearing(false);
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
  const [loaded, setLoaded] = useState<Selection | undefined>(() =>
    latest?.key === enhetIdsKey && Date.now() - latest.at < REUSE_LATEST_MS
      ? latest
      : undefined,
  );
  // A request already in flight was started by the panel before a remount,
  // whose cards have faded out; a skeleton would flash in between.
  const [continuesRequest] = useState(() => requests.has(enhetIdsKey));

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: enhetIdsKey stands in for enhetIds, which is a new array on every render, and `loaded` only matters when it changes
  useEffect(() => {
    if (loaded?.key === enhetIdsKey) {
      return;
    }

    let cancelled = false;
    requestSelection(enhetIds, enhetIdsKey).then((enhets) => {
      if (enhets.length > 0) {
        latest = { key: enhetIdsKey, enhets, at: Date.now() };
      }
      if (!cancelled) {
        setLoaded({ key: enhetIdsKey, enhets });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enhetIdsKey]);

  if (loaded?.enhets.length === 0) {
    return null;
  }

  const isLoading = loaded?.key !== enhetIdsKey;
  let cards: React.ReactNode = null;
  if (loaded) {
    cards = (
      <SelectionCards key={loaded.key} selection={loaded} leaving={isLoading} />
    );
  } else if (!continuesRequest) {
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
            <Heading level={4} data-size="sm" className={styles.detailsHeading}>
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
