import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  useState,
} from 'react';
import type { PopupPosition } from '~/lib/utils/calculatePopupPosition';
import EinPopup from '../EinPopup/EinPopup';
import styles from './EinTooltip.module.scss';

export default function EinTooltip({
  children,
  content,
  className = '',
  preferredPosition = ['below', 'above', 'right', 'left'],
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
  preferredPosition?: PopupPosition[];
}) {
  const [open, setOpen] = useState(false);

  const child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error(
      'EinTransition expects a single valid React element as its child.',
    );
  }

  const handleClick = (event: React.MouseEvent) => {
    setOpen(!open);
    // Call the original onClick handler if it exists
    const originalOnClick = (child.props as Record<string, unknown>)?.onClick;
    if (originalOnClick && typeof originalOnClick === 'function') {
      originalOnClick(event);
    }
  };

  const childWithClick = cloneElement(
    child as ReactElement<Record<string, unknown>>,
    {
      ...((child.props as Record<string, unknown>) || {}),
      onClick: handleClick,
    },
  );

  return (
    <>
      {childWithClick}
      <EinPopup
        open={!!content && open}
        setOpen={(isOpen) => setOpen(isOpen)}
        className={styles.tooltip}
        preferredPosition={preferredPosition}
      >
        <div
          className={`ein-tooltip ${className}`}
          role="tooltip"
          data-size="sm"
        >
          {content}
        </div>
      </EinPopup>
    </>
  );
}
