'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import type { RefObject } from 'react';
import { VList, type VListHandle } from 'virtua';
import type { TrimmedEnhet } from '~/actions/api/enhetActions';
import { EinInput } from '~/components/EinInput/EinInput';
import cn from '~/lib/utils/className';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorSelectItem } from './EnhetSelectorSelectItem';
import type { EnhetNode } from './useEnhetSelector';

export type EnhetSelectorProps = {
  className?: string;
  // State
  loading: boolean;
  searchString: string;
  visibleEnhetNodeList: EnhetNode[];
  selectedEnhetList: TrimmedEnhet[];
  focusedList: 'available' | 'selected';
  focusedIndex: number;
  // Refs
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  availableListRef: RefObject<VListHandle | null>;
  selectedListRef: RefObject<VListHandle | null>;
  // Handlers
  updateSearchString: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addEnhetHandler: (enhet: TrimmedEnhet) => void;
  removeEnhetHandler: (enhet: TrimmedEnhet) => void;
};

export default function EnhetSelector({
  className,
  loading,
  searchString,
  visibleEnhetNodeList,
  selectedEnhetList,
  focusedList,
  focusedIndex,
  containerRef,
  inputRef,
  availableListRef,
  selectedListRef,
  updateSearchString,
  addEnhetHandler,
  removeEnhetHandler,
}: EnhetSelectorProps) {
  const renderSkeleton = () => {
    const name = skeletonString(10, 60);

    return (
      <div className={cn(styles.selectorListItem)}>
        <span className={styles.selectorListText}>
          <span>
            <Skeleton>{name}</Skeleton>
          </span>
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(styles.enhetSelector, className, 'enhet-selector')}
      ref={containerRef}
    >
      <EinInput
        className={cn(styles.enhetSelectorFilterInput)}
        value={searchString}
        onChange={updateSearchString}
        placeholder="Finn virksomhet..."
        autoFocus={true}
        ref={inputRef}
      />
      <div className={cn(styles.enhetSelectorDropdown)}>
        {/* Available List */}
        <div className={cn(styles.enhetSelectorDropdownListContainer)}>
          <VList
            ref={availableListRef}
            className={cn(styles.enhetSelectorDropdownList)}
            style={{ contain: 'content' }}
          >
            {visibleEnhetNodeList.map((enhetNode, index) => (
              <EnhetSelectorSelectItem
                key={`add-${enhetNode.enhet.id}`}
                enhet={enhetNode.enhet}
                onClick={() => addEnhetHandler(enhetNode.enhet)}
                isFocused={
                  focusedList === 'available' && focusedIndex === index
                }
                isSelected={selectedEnhetList.some(
                  (e) => e.id === enhetNode.enhet.id,
                )}
              />
            ))}
            {loading &&
              [0, 1, 2, 3].map((i) => <div key={i}>{renderSkeleton()}</div>)}
          </VList>
        </div>

        {/* Selected List */}
        <div className={cn(styles.enhetSelectorDropdownListContainer)}>
          <VList
            ref={selectedListRef}
            className={cn(styles.enhetSelectorDropdownList)}
          >
            {selectedEnhetList.map((enhet, index) => (
              <EnhetSelectorSelectItem
                key={`remove-${enhet.id}`}
                enhet={enhet}
                remove={true}
                onClick={() => removeEnhetHandler(enhet)}
                isFocused={focusedList === 'selected' && focusedIndex === index}
              />
            ))}
          </VList>
        </div>
      </div>
    </div>
  );
}
