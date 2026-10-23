'use client';

import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import type { Party, PartyType } from './Korrespondansepart';
import styles from './PartyList.module.scss';

/**
 * A journalpost's senders or receivers. A name they all share (a screening
 * marker such as "Avskjermet") is given once with a count.
 */
export function PartyList({
  parties,
  type,
  interactive = true,
}: {
  parties: Party[];
  type: PartyType;
  // Off inside a row that is one click target: "+ N more" is then plain text.
  interactive?: boolean;
}) {
  const t = useTranslation();
  const [first] = parties;
  if (!first) {
    return null;
  }
  if (parties.length === 1) {
    // Wraps, since there is no popup to read a cut name in.
    return first.name;
  }
  if (parties.every((p) => p.name === first.name)) {
    // A capitalised single word reads as an adjective after "alle".
    const shared = /^\p{Lu}\p{Ll}+$/u.test(first.name)
      ? first.name.toLocaleLowerCase()
      : first.name;
    return t(
      `journalpost.partyCountAllSame.${type}`,
      String(parties.length),
      shared,
    );
  }
  return (
    <FittedPartyList parties={parties} type={type} interactive={interactive} />
  );
}

/**
 * Parties on one line, as many as fit. The rest collapse into "+ N more", a
 * button that opens a popup listing every party.
 */
function FittedPartyList({
  parties,
  type,
  interactive,
}: {
  parties: Party[];
  type: PartyType;
  interactive: boolean;
}) {
  const t = useTranslation();
  const rowRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupId = useId();
  const [visibleCount, setVisibleCount] = useState(parties.length);
  const [open, setOpen] = useState(false);
  const hiddenCount = parties.length - visibleCount;

  // Fits against a hidden copy of the whole list, so names come back when the
  // row widens. The copy also resizes when the font loads.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) {
      return;
    }
    const fit = () => {
      const names = measure.querySelectorAll('[data-name]');
      const more = measure.querySelector('[data-more]');
      const start = measure.getBoundingClientRect().left;
      const available = row.getBoundingClientRect().width;
      const moreWidth =
        Number.parseFloat(getComputedStyle(row).columnGap) +
        (more?.getBoundingClientRect().width ?? 0);
      let count = names.length;
      while (count > 1) {
        const end = names[count - 1].getBoundingClientRect().right - start;
        if (end + (count < names.length ? moreWidth : 0) <= available) {
          break;
        }
        count--;
      }
      setVisibleCount(count);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    observer.observe(measure);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={rowRef} className={styles.row}>
      <span className={styles.names}>
        {parties
          .slice(0, visibleCount)
          .map((party) => party.name)
          .join(', ')}
      </span>
      {hiddenCount > 0 && !interactive && (
        <span className={styles.more}>
          {t('common.andMore', String(hiddenCount))}
        </span>
      )}
      {hiddenCount > 0 && interactive && (
        <>
          <button
            ref={buttonRef}
            type="button"
            className={cn('ds-link', styles.more)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popupId : undefined}
            onClick={() => setOpen(!open)}
          >
            {t('common.andMore', String(hiddenCount))}
          </button>
          <EinPopup
            open={open}
            setOpen={setOpen}
            anchorRef={buttonRef}
            portal
            autoFocus
            restoreFocus
            contentProps={{
              id: popupId,
              role: 'dialog',
              'aria-label': t(
                `journalpost.partyCount.${type}`,
                String(parties.length),
              ),
            }}
          >
            <ul className={styles.list}>
              {parties.map((party) => (
                <li key={party.id} className={styles.item}>
                  {party.name}
                </li>
              ))}
            </ul>
          </EinPopup>
        </>
      )}
      <span className={styles.measure} aria-hidden="true">
        <span ref={measureRef}>
          {parties.map((party, index) => (
            <Fragment key={party.id}>
              {index > 0 && ', '}
              <span data-name>{party.name}</span>
            </Fragment>
          ))}
          <span data-more>
            {t('common.andMore', String(parties.length - 1))}
          </span>
        </span>
      </span>
    </span>
  );
}
