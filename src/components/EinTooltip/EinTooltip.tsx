import {
  Children,
  type ReactElement,
  cloneElement,
  isValidElement,
  useRef,
  useState,
} from 'react';
import EinPopup from '../EinPopup/EinPopup';

import styles from './EinTooltip.module.scss';

export default function EinTooltip({
  children,
  content,
  className = '',
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
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

  const childWithClick = cloneElement(child, {
    ...child.props,
    onClick: handleClick,
  });

  return (
    <>
      {childWithClick}
      <EinPopup
        open={!!content && open}
        setOpen={(isOpen) => setOpen(isOpen)}
        className={styles.tooltip}
      >
        <div className={`ein-tooltip ${className}`} role="tooltip">
          {content}
        </div>
      </EinPopup>
    </>
  );
}
