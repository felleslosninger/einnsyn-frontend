'use client';

import { type Enhet, isEnhet, type Saksmappe } from '@digdir/einnsyn-sdk';
import {
  ArrowUpIcon,
  BellIcon,
  FolderFileIcon,
  SortDownIcon,
} from '@navikt/aksel-icons';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import { HeaderTabs } from '~/components/HeaderTabs/HeaderTabs';
import {
  setHeaderCollapseDistance,
  setHeaderTwoLevel,
  useHeaderCollapsed,
} from '~/features/header/useHeaderMode';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { prefersReducedMotion } from '~/lib/utils/prefersReducedMotion';
import { capitalize } from '~/lib/utils/stringutils';
import { generateEnhetUrl } from '~/lib/utils/urlGenerators';
import styles from './SaksmappeHeader.module.scss';

// The journalpost list's heading lives here (in the header) rather than above the
// list, so it isn't shown twice. JournalpostList points its region's
// aria-labelledby at this id to stay programmatically labelled across the
// banner/main landmark boundary.
export const JOURNALPOST_LIST_HEADING_ID = 'saksmappe-journalpost-list-heading';

// Rendered inside the sticky site header (the `@header/case` slot), below the
// breadcrumb chrome row. A two-pose header: it stays full height until the page
// has scrolled past the collapse distance (= the body's height, i.e. expanded −
// compact), then flips to its compact pose in one transition via the
// `--ein-header-collapse` var (driven by the site Header's useHeaderCollapse).
// Only the body (kind / title / meta / enhet) collapses; the list bar below it
// ("Journalposter i saka" + Gå til toppen) is permanent, so it labels the
// journalpost list in both poses — the heading lives ONLY here instead of being
// repeated above the list. The threshold is chosen so the collapse fires exactly
// as the list would slide under the compact header — so there's no blank gap.
// The case title collapses with the body; it reappears in the breadcrumb as a
// link. Root is a <div>, not a <header>, to avoid nesting a second banner.
export default function SaksmappeHeader({
  saksmappe,
}: {
  saksmappe: Saksmappe;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  // Once the body has collapsed away, take its (now-clipped) links out of the
  // tab order / a11y tree, and hold the go-to-top control out while it's hidden
  // at the top — `inert` does this without touching the visual collapse. Toggles
  // only on the collapse crossing.
  const collapsed = useHeaderCollapsed();

  const rootRef = useRef<HTMLDivElement>(null);
  const bodyInnerRef = useRef<HTMLDivElement>(null);
  // Becomes true once the body's natural height is measured. Until then the
  // collapse `calc()` (which multiplies that px var) isn't applied, so the body
  // renders at its natural height server-side / pre-measure — no flash.
  const [measured, setMeasured] = useState(false);

  // Opt the site header into its two-level (threshold) collapse while this
  // saksmappe header is mounted (i.e. on saksmappe / journalpost pages); revert
  // on leave.
  useEffect(() => {
    setHeaderTwoLevel(true);
    return () => setHeaderTwoLevel(false);
  }, []);

  // Measure the collapsing body's natural height from its UNCONSTRAINED inner
  // node — the outer .body clip carries the height `calc()`, so observing the
  // inner node never feeds back. Publish it as a px var the CSS reads, and as the
  // collapse distance too: with a permanent (non-collapsing) list bar, expanded −
  // compact height is exactly the body's height. Measuring the body directly
  // keeps the math independent of the header's chrome and margins.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const bodyInner = bodyInnerRef.current;
    if (!root || !bodyInner) return;

    const measure = () => {
      const bodyH = bodyInner.offsetHeight;
      root.style.setProperty('--ein-sm-body-h', `${bodyH}px`);
      setHeaderCollapseDistance(Math.max(0, bodyH));
      setMeasured(true);
    };
    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(bodyInner);
    return () => observer.disconnect();
  }, []);

  // Clear the published distance on leave so a later non-saksmappe header doesn't
  // inherit a stale value.
  useEffect(() => () => setHeaderCollapseDistance(null), []);

  const e = saksmappe.administrativEnhetObjekt;
  const enhet: Enhet | undefined = isEnhet(e) ? e : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(styles.saksmappeHeader, { [styles.measured]: measured })}
    >
      {/* The page's only <h1>. It lives OUTSIDE the collapsing body because that
          body becomes `inert` once collapsed, which removes it from the
          ACCESSIBILITY TREE and not just the tab order — so a heading in there
          would leave the document with no top-level heading whenever the user has
          scrolled. `.ds-sr-only` is absolutely positioned, so it adds nothing to
          the layout and can't perturb the --ein-sm-body-h measurement. */}
      <h1 className="ds-sr-only">{saksmappe.offentligTittel}</h1>

      {/* Collapsing body: the outer .body is the height-controlled clip (its
          height tracks --ein-header-collapse); .bodyInner is the unconstrained,
          measured content. Everything here collapses on scroll — the title
          included; it reappears (as a link) in the breadcrumb. */}
      <div className={styles.body}>
        <div
          ref={bodyInnerRef}
          className={styles.bodyInner}
          inert={collapsed || undefined}
        >
          <div className={styles.main}>
            <div className={styles.kindRow}>
              <span className={styles.kindIcon} aria-hidden="true">
                <FolderFileIcon />
              </span>
              <span className={styles.kindLabel}>{t('saksmappe.label')}</span>
            </div>

            {/* Visual title only — the real heading is the permanent <h1> above.
                aria-hidden so the same text isn't announced twice. */}
            <p className={styles.title} aria-hidden="true">
              {saksmappe.offentligTittel}
            </p>

            <div className={styles.metaAndFollow}>
              <dl className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <dt>{t('saksmappe.saksnummer')}:</dt>
                  <dd>{saksmappe.saksnummer}</dd>
                </div>
                {saksmappe.saksdato && (
                  <div className={styles.metaItem}>
                    <dt>{t('saksmappe.journalfoert')}:</dt>
                    <dd>{dateFormat(saksmappe.saksdato, languageCode)}</dd>
                  </div>
                )}
                {saksmappe.publisertDato && (
                  <div className={styles.metaItem}>
                    <dt>{t('common.publishedAt')}:</dt>
                    <dd>{dateFormat(saksmappe.publisertDato, languageCode)}</dd>
                  </div>
                )}
              </dl>

              <EinLink href="#" className={styles.followLink}>
                <BellIcon aria-hidden="true" />
                <span>{t('saksmappe.follow')}</span>
              </EinLink>
            </div>
          </div>

          {enhet && (
            <aside className={cn(styles.enhetCard, 'enhetCard')}>
              <div className={cn('ds-card__block', styles.enhetCardBlock)}>
                <div className={styles.enhetCardHeading}>
                  {t('saksmappe.publishedBy')}
                </div>
                <EinLink
                  href={generateEnhetUrl(enhet)}
                  className={styles.enhetName}
                >
                  {enhet.navn}
                </EinLink>
                <div className={styles.enhetFields}>
                  {enhet.kontaktpunktTelefon && (
                    <div className={styles.enhetField}>
                      <span className={styles.enhetFieldLabel}>
                        {capitalize(t('virksomhet.telefon'))}
                      </span>{' '}
                      <span className={styles.enhetFieldValue}>
                        {enhet.kontaktpunktTelefon}
                      </span>
                    </div>
                  )}
                  {enhet.kontaktpunktEpost && (
                    <div className={styles.enhetField}>
                      <span className={styles.enhetFieldLabel}>
                        {capitalize(t('virksomhet.epost'))}
                      </span>{' '}
                      <EinLink href={`mailto:${enhet.kontaktpunktEpost}`}>
                        {enhet.kontaktpunktEpost}
                      </EinLink>
                    </div>
                  )}
                  {enhet.kontaktpunktAdresse && (
                    <div className={styles.enhetField}>
                      <span className={styles.enhetFieldLabel}>
                        {capitalize(t('virksomhet.adresse'))}
                      </span>{' '}
                      <span className={styles.enhetFieldValue}>
                        {enhet.kontaktpunktAdresse}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Permanent list bar — does NOT collapse, so it stays visible in both
          poses; once the body collapses away it's all that's left below the
          chrome row. Reuses HeaderTabs so it matches the search section's tab row
          exactly: the journalpost heading is the single (active) tab — it lives
          only here (the list points its region's aria-labelledby at it) instead
          of being repeated above the list. The trailing slot shows the sort
          control at the top and the back-to-top link once collapsed. */}
      <HeaderTabs
        actions={
          collapsed ? (
            // A link (not a button): the classic "back to top" anchor. EinLink
            // keeps it off biome's native-anchor lint; preventDefault stops the
            // `#` navigation so it only scrolls (which re-expands the header).
            <EinLink
              href="#"
              unstyled
              prefetch={false}
              className={styles.goToTop}
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({
                  top: 0,
                  behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                });
              }}
            >
              <span>{t('common.goToTop')}</span>
              <ArrowUpIcon aria-hidden="true" />
            </EinLink>
          ) : (
            <button
              type="button"
              className={styles.sortButton}
              aria-label={t('searchFilters.sorting')}
            >
              <SortDownIcon aria-hidden="true" />
            </button>
          )
        }
      >
        <h2 id={JOURNALPOST_LIST_HEADING_ID} className="header-tab active">
          {t('journalpost.labelPluralInCase')}
        </h2>
      </HeaderTabs>
    </div>
  );
}
