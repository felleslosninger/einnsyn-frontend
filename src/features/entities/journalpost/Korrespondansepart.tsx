'use client';

import { type Enhet, isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { ArrowRightIcon } from '@navikt/aksel-icons';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EinPopup from '~/components/EinPopup/EinPopup';
import EnhetLink from '~/features/search/searchresult/common/EnhetLink';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './Korrespondansepart.module.scss';

// The two parties of a journalpost, ordered by direction:
//   incoming  →  [external sender] → [owner enhet]
//   outgoing  →  [owner enhet]     → [external recipient]
// The "other" party — the one that isn't the case's own administrative unit —
// is the external counterparty in both cases (the sender on incoming, the
// recipient on outgoing) and is what `markOther` emphasises.

type Party = { id: string; name: string };

// A journalpost can carry many counterparties (e.g. a letter sent to dozens of
// recipients). We list every matching one and let `ExternalParty` show only the
// first until the rest are opened in a popup. The id gives each a stable key.
function externalParties(journalpost: Journalpost, role: RegExp): Party[] {
  return (journalpost.korrespondansepart ?? [])
    .filter((k) => typeof k !== 'string')
    .filter((k) => role.test(k.korrespondanseparttype))
    .map((k) => ({ id: k.id, name: k.korrespondansepartNavnSensitiv }))
    .filter((p): p is Party => Boolean(p.name));
}

// Shows the first counterparty inline. When there are more, a toggle opens a
// popup listing every party in a scrollable panel — so a journalpost with a
// handful or with thousands of recipients keeps the row the same compact size.
function ExternalParty({
  parties,
  marked,
}: {
  parties: Party[];
  marked: boolean;
}) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  // The popup is portalled to <body> so it escapes the journalpost list's
  // `overflow: clip` + virtua transforms, which otherwise clip it and throw off
  // its anchored position. Resolved in an effect to stay SSR-safe.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setPortalTarget(document.body), []);

  if (parties.length === 0) {
    return <span className={cn(styles.name, { [styles.marked]: marked })} />;
  }

  const [first] = parties;
  const hiddenCount = parties.length - 1;

  // `autoFocus`/`restoreFocus` make EinPopup manage focus like a dialog: moving
  // it into the panel on open (the portal puts it at end-of-<body>, so DOM order
  // can't carry the relationship) and back to the toggle on close. `contentProps`
  // gives the focused container its dialog role + name.
  const popup = (
    <EinPopup
      open={open}
      setOpen={setOpen}
      anchorRef={toggleRef}
      autoFocus
      restoreFocus
      contentProps={{
        id: dialogId,
        role: 'dialog',
        'aria-label': t('journalpost.allParties'),
      }}
    >
      <ul className={styles.partyList}>
        {parties.map((party) => (
          <li key={party.id} className={styles.partyItem}>
            {party.name}
          </li>
        ))}
      </ul>
    </EinPopup>
  );

  return (
    <span className={cn(styles.name, { [styles.marked]: marked })}>
      {first.name}
      {hiddenCount > 0 && (
        <span className={styles.more}>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? dialogId : undefined}
            onClick={() => setOpen((v) => !v)}
          >
            {t('journalpost.moreParties', String(hiddenCount))}
          </button>
          {portalTarget && createPortal(popup, portalTarget)}
        </span>
      )}
    </span>
  );
}

function OwnerParty({ owner }: { owner: Enhet | string | undefined }) {
  // An Enhet links to that unit; a plain name renders as text. The list passes
  // the name string; richer surfaces (search) can pass the Enhet for a link. An
  // unexpanded id (string) with no resolvable name renders as-is.
  if (isEnhet(owner)) {
    return <EnhetLink withAncestors={false} enhet={owner} />;
  }
  return <>{owner}</>;
}

export function Korrespondansepart({
  journalpost,
  owner = journalpost.administrativEnhetObjekt,
  markOther = true,
  className,
}: {
  journalpost: Journalpost;
  // The eInnsyn party — the case's administrative unit. Defaults to the
  // journalpost's own `administrativEnhetObjekt`, which is a full Enhet when
  // expanded (detail/search payloads). In the case's list payload it's left
  // unexpanded (a string id), so that caller passes the resolved name instead.
  owner?: Enhet | string | undefined;
  // Emphasise the counterparty (sender on incoming, recipient on outgoing).
  markOther?: boolean;
  className?: string;
}) {
  const type = journalpost.journalposttype;
  const isIncoming = type === 'inngaaende_dokument';
  const isOutgoing = type === 'utgaaende_dokument';

  // Only the in/out directions have a from→to pair to show. Other types
  // (organinternt, saksframlegg, …) have no counterparty here.
  if (!isIncoming && !isOutgoing) return null;

  const external = isIncoming
    ? externalParties(journalpost, /^[Aa]vsender$/)
    : externalParties(journalpost, /^[Mm]ottaker$/);

  const externalParty = <ExternalParty parties={external} marked={markOther} />;
  const ownerParty = (
    <span className={styles.name}>
      <OwnerParty owner={owner} />
    </span>
  );

  const [from, to] = isIncoming
    ? [externalParty, ownerParty]
    : [ownerParty, externalParty];

  return (
    <div className={cn(styles.korr, className)}>
      {from}
      <ArrowRightIcon aria-hidden="true" className={styles.arrow} />
      {to}
    </div>
  );
}
