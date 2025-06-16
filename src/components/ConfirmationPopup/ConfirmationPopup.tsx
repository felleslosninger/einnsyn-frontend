'use client';

import { EinButton } from '~/components/EinButton/EinButton';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './ConfirmationPopup.module.scss';

interface ConfirmationPopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export default function ConfirmationPopup({
  open,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}: ConfirmationPopupProps) {
  const t = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <EinPopup
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      closeOnOutsideClick={!isDeleting}
      closeOnEsc={!isDeleting}
      className={styles['confirmation-popup']}
    >
      <div className={styles['confirmation-content']}>
        <div className={styles['confirmation-header']}>
          <h3>{title}</h3>
        </div>
        <div className={styles['confirmation-body']}>
          <p>{message}</p>
        </div>
        <div className={styles['confirmation-footer']}>
          <EinButton
            onClick={onClose}
            variant="secondary"
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </EinButton>
          <EinButton
            onClick={handleConfirm}
            variant="primary"
            data-color="danger"
            disabled={isDeleting}
          >
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </EinButton>
        </div>
      </div>
    </EinPopup>
  );
}
