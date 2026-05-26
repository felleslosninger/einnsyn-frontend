'use client';

import { Search, Skeleton } from '@digdir/designsystemet-react';
import { Buildings3Icon, CheckmarkIcon } from '@navikt/aksel-icons';
import { useCallback, useMemo } from 'react';
import { VList } from 'virtua';
import EinModal, { EinModalHeader } from '~/components/EinModal/EinModal';
import type { EinTransitionEvents } from '~/components/EinTransition/EinTransition';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { getAncestorsAsString, getName } from '~/lib/utils/enhetUtils';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './EnhetSelector.module.scss';
import type { EnhetSelectorState } from './useEnhetSelectorState';

type Props = {
  state: EnhetSelectorState;
  active: boolean;
  activate: () => void;
  close: () => void;
};

export function EnhetSelectorMobile({ state, active, activate, close }: Props) {
  const t = useTranslation();
  const { inputRef } = state;

  // See EnhetSelectorDesktop — focus the filter input once the sheet is
  // actually visible, since EinTransition hides it during the init pose.
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
        <SummaryButton active={active} state={state} activate={activate} />
      </div>

      <EinModal
        className={styles.mobileSheetModal}
        open={active}
        onClose={close}
        transitionEvents={transitionEvents}
      >
        <EinModalHeader title={t('search.enhetSelectorTitle')} />
        <FilterField state={state} />
        <div className={styles.mobileListContainer}>
          <MobileList state={state} />
        </div>
      </EinModal>
    </>
  );
}

// 
// Summary button (mobile trigger — "Søker i X | Endre")
// 

type SummaryButtonProps = {
  active: boolean;
  state: EnhetSelectorState;
  activate: () => void;
};

const SummaryButton = ({ active, state, activate }: SummaryButtonProps) => {
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
  // close the sheet.
  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!active) return;
      event.preventDefault();
      focusInput();
    },
    [active, focusInput],
  );

  // The summary button is inside the search form on mobile. Without this, a
  // focus event would bubble to the form and change focus styling unexpectedly.
  const onFocus = useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      if (active) return;
      event.stopPropagation();
    },
    [active],
  );

  return (
    <button
      type="button"
      className={cn(styles.mobileSummaryButton, {
        [styles.summaryButtonActive]: active,
      })}
      aria-label={selectedSummary || t('search.enhetPlaceholder')}
      aria-expanded={active}
      aria-haspopup="listbox"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onFocus={onFocus}
    >
      <span className={styles.mobileSummaryText}>
        <span className={styles.mobileSummaryPrefix}>
          {t('search.searchingIn')}
        </span>{' '}
        <span
          className={cn(styles.mobileSummaryLabel, {
            [styles.mobileSummaryLabelPlaceholder]: !hasSelection,
          })}
        >
          {summaryLabel}
        </span>
      </span>
      {additionalSelectedCount > 0 && (
        <span className={styles.mobileSummaryMore} aria-hidden="true">
          +{additionalSelectedCount}
        </span>
      )}
      <span className={styles.mobileSummaryChange} aria-hidden="true">
        {t('common.change')}
      </span>
    </button>
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
// Flat list: "Alle" item, then selected matches (pinned), then available.
// 

const MobileList = ({ state }: { state: EnhetSelectorState }) => {
  const t = useTranslation();
  const languageCode = useLanguageCode();
  const {
    availableListRef,
    availableNodes,
    searchMatchedSelectedNodes,
    fullListLoaded,
    filterValue,
    focus,
    focusedOptionId,
    toggleEnhet,
    clearSelected,
    hasSelection,
    onListNavKeyDown,
    onListFocus,
  } = state;

  const showAllItem = filterValue.trim().length === 0;
  const showSectionHeaders = searchMatchedSelectedNodes.length > 0;

  const handleFocus = useCallback(
    (event: React.FocusEvent) => onListFocus(event, 'available'),
    [onListFocus],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: wrapper carries the focus ring; the focusable element is the VList inside.
    <div className={styles.mobileList} onFocus={handleFocus}>
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
        {showAllItem && (
          <MobileRow
            id="enhet-option-all"
            label={t('search.enhetPlaceholder')}
            isSelected={!hasSelection}
            onClick={clearSelected}
          />
        )}

        {showSectionHeaders && (
          <div className={styles.mobileSectionHeader}>
            {t('search.selectedEnheter')} ({searchMatchedSelectedNodes.length})
          </div>
        )}
        {searchMatchedSelectedNodes.map((node) => (
          <MobileRow
            key={`selected-${node.enhet.id}`}
            id={`enhet-option-selected-${node.enhet.id}`}
            label={getName(node.enhet, languageCode)}
            ancestors={
              getAncestorsAsString(node.enhet, ' / ', languageCode) || undefined
            }
            isSelected
            onClick={() => toggleEnhet(node.enhet)}
          />
        ))}

        {showSectionHeaders && availableNodes.length > 0 && (
          <div className={styles.mobileSectionHeader}>
            {t('search.availableEnheter')}
          </div>
        )}
        {availableNodes.map((node, index) => (
          <MobileRow
            key={`available-${node.enhet.id}`}
            id={`enhet-option-available-${node.enhet.id}`}
            label={getName(node.enhet, languageCode)}
            ancestors={
              getAncestorsAsString(node.enhet, ' / ', languageCode) || undefined
            }
            isFocused={focus?.list === 'available' && focus.index === index}
            onClick={() => toggleEnhet(node.enhet)}
          />
        ))}

        {!fullListLoaded && <SkeletonRows />}
        {fullListLoaded &&
          searchMatchedSelectedNodes.length === 0 &&
          availableNodes.length === 0 && (
            <div className={styles.emptyState}>{t('common.noResults')}</div>
          )}
      </VList>
    </div>
  );
};

// 
// Row (iOS-picker style: leading icon, label + ancestors, trailing checkmark)
// 

type MobileRowProps = {
  id: string;
  label: string;
  ancestors?: string;
  isSelected?: boolean;
  isFocused?: boolean;
  onClick: () => void;
};

const MobileRow = ({
  id,
  label,
  ancestors,
  isSelected = false,
  isFocused = false,
  onClick,
}: MobileRowProps) => (
  <button
    type="button"
    id={id}
    tabIndex={-1}
    aria-label={ancestors ? `${ancestors} / ${label}` : label}
    aria-selected={isSelected}
    data-focused={isFocused}
    onClick={onClick}
    role="option"
    className={cn(styles.mobileListItem, {
      [styles.mobileListItemSelected]: isSelected,
      [styles.focusedListItem]: isFocused,
    })}
  >
    <Buildings3Icon
      className={styles.mobileListIcon}
      fontSize="1.25rem"
      aria-hidden="true"
    />
    <span className={styles.mobileListText}>
      {ancestors && (
        <span className={styles.mobileListAncestors}>{ancestors}</span>
      )}
      <span className={styles.mobileListLabel}>{label}</span>
    </span>
    {isSelected && (
      <CheckmarkIcon
        className={styles.mobileListCheck}
        fontSize="1.25rem"
        aria-hidden="true"
      />
    )}
  </button>
);

const SkeletonRows = () => (
  <>
    {[0, 1, 2, 3].map((index) => (
      <div key={`loading-mobile-${index}`} className={styles.selectorListItem}>
        <span className={styles.selectorListText}>
          <span>
            <Skeleton>{skeletonString(10, 60)}</Skeleton>
          </span>
        </span>
      </div>
    ))}
  </>
);
