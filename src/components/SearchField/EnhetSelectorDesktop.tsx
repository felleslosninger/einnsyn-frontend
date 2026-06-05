'use client';

import { Button, Search, Skeleton } from '@digdir/designsystemet-react';
import { Buildings3Icon, PlusIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useMemo, useRef } from 'react';
import { VList } from 'virtua';
import EinPopup from '~/components/EinPopup/EinPopup';
import type { EinTransitionEvents } from '~/components/EinTransition/EinTransition';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import type { LanguageCode } from '~/lib/translation/translation';
import type { PopupPosition } from '~/lib/utils/calculatePopupPosition';
import cn from '~/lib/utils/className';
import {
  getAncestorsAsString,
  getName,
  type TrimmedEnhet,
} from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './EnhetSelector.module.scss';
import type { EnhetSelectorState } from './useEnhetSelectorState';

type Translate = (
  fullKey: string,
  ...replacements: (string | undefined)[]
) => string;

// Stable reference — passing an inline array would re-create the
// `updatePopupPosition` callback inside EinPopup on every render and trigger
// a reposition after every state change.
const POPUP_PREFERRED_POSITION: PopupPosition[] = ['belowRight'];

type Props = {
  state: EnhetSelectorState;
  active: boolean;
  activate: () => void;
  close: () => void;
};

export function EnhetSelectorDesktop({
  state,
  active,
  activate,
  close,
}: Props) {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const summaryButtonRef = useRef<HTMLButtonElement>(null);
  const { inputRef } = state;

  const getRowSubtitle = useCallback(
    (enhet: TrimmedEnhet): string | undefined =>
      buildDesktopRowSubtitle(enhet, languageCode, t),
    [languageCode, t],
  );

  // Focus the filter input once the popup is actually visible.
  // EinTransition hides the popup (`display: none`) during its init pose, so
  // an `active`-side effect can't focus it directly — onEnterTransition fires
  // after the element has been revealed.
  const transitionEvents = useMemo<EinTransitionEvents>(
    () => ({
      onEnterTransition: () => {
        inputRef.current?.focus();
      },
    }),
    [inputRef],
  );

  return (
    <>
      <div className={styles.selectorField}>
        <SummaryButton
          buttonRef={summaryButtonRef}
          active={active}
          state={state}
          activate={activate}
        />
      </div>

      <EinPopup
        open={active}
        // Clicking outside commits the draft selection. To discard changes
        // the user must hit the explicit Cancel button (which calls `close`).
        setOpen={(value) => !value && state.applySelection()}
        anchorRef={summaryButtonRef}
        className={styles.desktopSelectorPopup}
        preferredPosition={POPUP_PREFERRED_POSITION}
        closeOnEsc={false}
        trapFocus={false}
        arrow={false}
        animate={false}
        transitionEvents={transitionEvents}
      >
        <DesktopHeader />
        <div className={styles.desktopBody}>
          <FilterField state={state} />
          <div className={styles.desktopColumns}>
            <AvailableColumn state={state} getRowSubtitle={getRowSubtitle} />
            <SelectedColumn state={state} getRowSubtitle={getRowSubtitle} />
          </div>
        </div>
        <DesktopFooter state={state} close={close} />
      </EinPopup>
    </>
  );
}

//
// Summary button (popup trigger)
//

type SummaryButtonProps = {
  active: boolean;
  state: EnhetSelectorState;
  activate: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
};

const SummaryButton = ({
  buttonRef,
  active,
  state,
  activate,
}: SummaryButtonProps) => {
  const t = useTranslation();
  const {
    summaryLabel,
    additionalSelectedCount,
    selectedSummary,
    hasSelection,
    focusInput,
  } = state;

  const onClick = useCallback(() => {
    activate();
    focusInput();
  }, [activate, focusInput]);

  // Clicking the summary while open should refocus the input rather than
  // close the popup.
  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!active) return;
      event.preventDefault();
      focusInput();
    },
    [active, focusInput],
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn(styles.summaryButton, {
        [styles.summaryButtonActive]: active,
      })}
      aria-label={selectedSummary || t('search.enhetPlaceholder')}
      aria-expanded={active}
      aria-haspopup="listbox"
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <span className={styles.summaryIcon}>
        <Buildings3Icon
          className={styles.searchIcon}
          fontSize="1.2rem"
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(styles.summaryText, {
          [styles.placeholderText]: !hasSelection,
        })}
      >
        {summaryLabel}
      </span>
      {additionalSelectedCount > 0 && (
        <span className={styles.summaryMore} aria-hidden="true">
          +{additionalSelectedCount}
        </span>
      )}
    </button>
  );
};

//
// Header / Footer
//

const DesktopHeader = () => {
  const t = useTranslation();
  return (
    <div className={styles.desktopHeader}>
      <div className={styles.desktopTitleBlock}>
        <h1 className={styles.desktopTitle}>
          {t('search.enhetSelectorTitleDesktop')}
        </h1>
        <p className={styles.desktopSubtitle}>
          {t('search.enhetSelectorSubtitle')}
        </p>
      </div>
    </div>
  );
};

type DesktopFooterProps = { state: EnhetSelectorState; close: () => void };

const DesktopFooter = ({ state, close }: DesktopFooterProps) => {
  const t = useTranslation();
  return (
    <div className={styles.desktopFooter}>
      <span className={styles.desktopFooterCount}>
        {t('search.selectionCount', String(state.selectedEnheter.length))}
      </span>
      <Button
        type="button"
        data-color="neutral"
        data-variant="tertiary"
        onClick={close}
      >
        {t('common.cancel')}
      </Button>
      <Button
        type="button"
        data-color="accent"
        data-variant="primary"
        onClick={state.applySelection}
      >
        {t('search.applySelection')}
      </Button>
    </div>
  );
};

//
// Filter field
//

const FilterField = ({ state }: { state: EnhetSelectorState }) => {
  const t = useTranslation();
  return (
    <div className={styles.filterField}>
      <Search>
        <Search.Input
          ref={state.inputRef}
          className={styles.filterFieldInput}
          value={state.filterValue}
          onChange={state.onInputChange}
          onKeyDown={state.onInputKeyDown}
          aria-label={t('search.enhetFilterPlaceholder')}
          aria-activedescendant={state.focusedOptionId}
          placeholder={t('search.enhetFilterPlaceholder')}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
        />
        <Search.Clear aria-label={t('search.clear')} />
      </Search>
    </div>
  );
};

//
// Available / Selected columns
//

type ColumnProps = {
  state: EnhetSelectorState;
  getRowSubtitle: (enhet: TrimmedEnhet) => string | undefined;
};

const AvailableColumn = ({ state, getRowSubtitle }: ColumnProps) => {
  const t = useTranslation();
  const {
    availableNodes,
    fullListLoaded,
    focus,
    focusedOptionId,
    addEnhet,
    availableListRef,
    onListNavKeyDown,
    onListFocus,
  } = state;

  const handleFocus = useCallback(
    (event: React.FocusEvent) => onListFocus(event, 'available'),
    [onListFocus],
  );

  return (
    <div className={styles.desktopColumn}>
      <div className={styles.desktopColumnHeader}>
        <span className={styles.desktopColumnLabel}>
          {t('search.availableEnheter')}
        </span>
      </div>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: wrapper carries the focus ring; the focusable element is the VList inside. */}
      <div className={styles.desktopColumnList} onFocus={handleFocus}>
        <VList
          ref={availableListRef}
          style={{ contain: 'content' }}
          aria-label={t('search.availableEnheter')}
          aria-activedescendant={
            focus?.list === 'available' ? focusedOptionId : undefined
          }
          role="listbox"
          tabIndex={0}
          onKeyDown={onListNavKeyDown}
        >
          {availableNodes.map((node, index) => (
            <DesktopRow
              key={`available-${node.enhet.id}`}
              id={`enhet-option-available-${node.enhet.id}`}
              enhet={node.enhet}
              subtitle={getRowSubtitle(node.enhet)}
              variant="available"
              isFocused={focus?.list === 'available' && focus.index === index}
              onClick={() => addEnhet(node.enhet)}
            />
          ))}
          {!fullListLoaded && <SkeletonRows keyPrefix="loading-available" />}
          {fullListLoaded && availableNodes.length === 0 && (
            <div className={styles.emptyState}>{t('common.noResults')}</div>
          )}
        </VList>
      </div>
    </div>
  );
};

const SelectedColumn = ({ state, getRowSubtitle }: ColumnProps) => {
  const t = useTranslation();
  const {
    selectedEnheter,
    focus,
    focusedOptionId,
    removeEnhet,
    clearSelected,
    selectedListRef,
    onListNavKeyDown,
    onListFocus,
  } = state;

  const handleFocus = useCallback(
    (event: React.FocusEvent) => onListFocus(event, 'selected'),
    [onListFocus],
  );

  return (
    <div className={styles.desktopColumn}>
      <div className={styles.desktopColumnHeader}>
        <span className={styles.desktopColumnLabel}>
          {t('search.selectedEnheter')}
        </span>
        {selectedEnheter.length > 0 && (
          <Button
            type="button"
            data-variant="tertiary"
            data-size="sm"
            className={styles.desktopClearAllButton}
            onClick={clearSelected}
          >
            {t('common.removeAll')}
          </Button>
        )}
      </div>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: wrapper carries the focus ring; the focusable element is the VList inside. */}
      <div className={styles.desktopColumnList} onFocus={handleFocus}>
        <VList
          ref={selectedListRef}
          aria-label={t('search.selectedEnheter')}
          aria-activedescendant={
            focus?.list === 'selected' ? focusedOptionId : undefined
          }
          role="listbox"
          tabIndex={0}
          onKeyDown={onListNavKeyDown}
        >
          {selectedEnheter.map((enhet, index) => (
            <DesktopRow
              key={`selected-${enhet.id}`}
              id={`enhet-option-selected-${enhet.id}`}
              enhet={enhet}
              subtitle={getRowSubtitle(enhet)}
              variant="selected"
              isFocused={focus?.list === 'selected' && focus.index === index}
              onClick={() => removeEnhet(enhet)}
            />
          ))}
        </VList>
      </div>
    </div>
  );
};

//
// Row (name + subtitle on the left, action pill on the right)
//

type DesktopRowProps = {
  id: string;
  enhet: TrimmedEnhet;
  subtitle?: string;
  variant: 'available' | 'selected';
  isFocused: boolean;
  onClick: () => void;
};

const DesktopRow = ({
  id,
  enhet,
  subtitle,
  variant,
  isFocused,
  onClick,
}: DesktopRowProps) => {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const name = useMemo(
    () => getName(enhet, languageCode),
    [enhet, languageCode],
  );
  const isSelectedColumn = variant === 'selected';
  const ActionIcon = isSelectedColumn ? XMarkIcon : PlusIcon;
  const actionLabel = isSelectedColumn ? t('common.remove') : t('common.add');

  return (
    <button
      type="button"
      id={id}
      tabIndex={-1}
      aria-label={`${actionLabel}: ${name}`}
      aria-selected={isSelectedColumn || undefined}
      data-focused={isFocused}
      onClick={onClick}
      role="option"
      className={cn(styles.selectorListItem, {
        [styles.focusedListItem]: isFocused,
      })}
    >
      <span className={styles.selectorListText}>
        <span className={styles.selectorListName}>{name}</span>
        {subtitle && (
          <span className={styles.selectorListSubtitle}>{subtitle}</span>
        )}
      </span>
      <span className={styles.selectorListAction}>
        <ActionIcon fontSize="1rem" aria-hidden="true" />
        <span className={styles.selectorListActionLabel}>{actionLabel}</span>
      </span>
    </button>
  );
};

//
// Helpers
//

const SkeletonRows = ({ keyPrefix }: { keyPrefix: string }) => (
  <>
    {[0, 1, 2, 3].map((index) => (
      <div key={`${keyPrefix}-${index}`} className={styles.selectorListItem}>
        <span className={styles.selectorListText}>
          <span>
            <Skeleton>{skeletonString(10, 60)}</Skeleton>
          </span>
        </span>
      </div>
    ))}
  </>
);

/**
 * Builds the row subtitle for the desktop list: ancestors when the enhet is a
 * sub-unit, else "Type · org.nr 123 456 789" for top-level enheter so the
 * user can disambiguate organisations that share a name.
 */
function buildDesktopRowSubtitle(
  enhet: TrimmedEnhet,
  languageCode: LanguageCode,
  t: Translate,
): string | undefined {
  const ancestors = getAncestorsAsString(enhet, ' / ', languageCode);
  if (ancestors) return ancestors;

  const typeKey = `search.enhetstype.${enhet.enhetstype}`;
  const typeLabel = t(typeKey);
  const hasTypeLabel = typeLabel !== typeKey;

  if (hasTypeLabel) return typeLabel;
  return undefined;
}
