'use client';

import { Switch, ValidationMessage } from '@digdir/designsystemet-react';
import { TrashIcon } from '@navikt/aksel-icons';
import { type ReactNode, useRef, useState, useTransition } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { useTranslation } from '~/hooks/useTranslation';
import {
  deleteBrukerItemAction,
  setBrukerItemSubscriptionAction,
} from './bruker.actions';
import styles from './List.module.scss';

/**
 * The row around an item in a user's list: its content, a delete button, and
 * a subscribe switch for the entities that can be subscribed to.
 */
export default function ListItem({
  entity,
  id,
  title,
  subscribed = false,
  onDelete,
  children,
}: {
  entity: 'LagretSak' | 'LagretSoek' | 'Innsynskrav';
  id: string;
  /** Read out with the controls, which are the same on every item. */
  title?: string;
  subscribed?: boolean;
  onDelete: () => void;
  children: ReactNode;
}) {
  const t = useTranslation();
  const itemRef = useRef<HTMLLIElement>(null);
  const [error, setError] = useState<string>();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [subscribe, setSubscribe] = useState(subscribed);
  const [isUpdating, setIsUpdating] = useState(false);

  const hiddenTitle = <span className="ds-sr-only"> {title}</span>;

  const handleSubscribeChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // One update at a time, so `!checked` is always the last saved value.
    if (isUpdating || entity === 'Innsynskrav') {
      return;
    }
    const checked = e.target.checked;
    setError(undefined);
    setSubscribe(checked);
    setIsUpdating(true);
    // A failed API call returns false, but a failed request rejects.
    const saved = await setBrukerItemSubscriptionAction(
      entity,
      id,
      checked,
    ).catch(() => false);
    setIsUpdating(false);
    if (!saved) {
      setSubscribe(!checked);
      setError(t('bruker.subscribeError'));
    }
  };

  const handleDelete = () => {
    if (isDeleting) {
      return;
    }
    setError(undefined);
    startDeleteTransition(async () => {
      if (await deleteBrukerItemAction(entity, id).catch(() => false)) {
        // Keep keyboard focus in the list as this item's button disappears:
        // on the next item, or the previous one if this was the last.
        const neighbour =
          itemRef.current?.nextElementSibling ??
          itemRef.current?.previousElementSibling;
        neighbour?.querySelector<HTMLElement>('a, button')?.focus();
        onDelete();
      } else {
        setError(t('bruker.deleteError'));
      }
    });
  };

  return (
    <li ref={itemRef} className={styles.item}>
      <div className={styles.row}>
        <div className={styles.main}>{children}</div>
        <div className={styles.actions}>
          {entity !== 'Innsynskrav' && (
            <Switch
              data-size="sm"
              checked={subscribe}
              onChange={handleSubscribeChange}
              label={
                <>
                  {t('common.subscribe')}
                  {hiddenTitle}
                </>
              }
            />
          )}
          <EinButton
            variant="tertiary"
            data-size="sm"
            loading={isDeleting}
            onClick={handleDelete}
          >
            {!isDeleting && <TrashIcon aria-hidden="true" />}
            {t('common.delete')}
            {hiddenTitle}
          </EinButton>
        </div>
      </div>
      {error && (
        <ValidationMessage data-size="sm" role="alert">
          {error}
        </ValidationMessage>
      )}
    </li>
  );
}
