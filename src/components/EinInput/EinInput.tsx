import {
  Field,
  Input,
  type InputProps,
  Label,
} from '@digdir/designsystemet-react';
import {
  CheckmarkIcon,
  FilesIcon,
  QuestionmarkIcon,
} from '@navikt/aksel-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { logger } from '~/lib/utils/logger';
import { EinButton } from '../EinButton/EinButton';
import EinTooltip from '../EinTooltip/EinTooltip';
import styles from './EinInput.module.scss';

type EinInputProps = {
  fullWidth?: boolean;
  errorMessage?: string;
  label?: string;
  tooltip?: string;
  copyToClipboard?: boolean;
  ref?: React.Ref<HTMLInputElement>;
};

export const EinInput = ({
  fullWidth = false,
  errorMessage,
  label,
  tooltip,
  copyToClipboard = false,
  ref,
  className,
  ...props
}: InputProps & EinInputProps) => {
  const t = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboardHandler = async () => {
    const value = inputRef.current?.value;
    if (value !== undefined) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        logger.error('Failed to copy: ', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Field
      className={cn(className, styles['ein-input'], {
        [styles['full-width']]: fullWidth,
      })}
    >
      {label && (
        <Label>
          <span>{label}</span>
          {copyToClipboard && (
            <EinButton
              variant="tertiary"
              className="copy-to-clipboard"
              onClick={copyToClipboardHandler}
              aria-live="polite"
            >
              {copied ? (
                <CheckmarkIcon
                  title={t('common.copiedToClipboard')}
                  fontSize="1.5rem"
                />
              ) : (
                <FilesIcon
                  title={t('common.copyToClipboard')}
                  fontSize="1.5rem"
                />
              )}
            </EinButton>
          )}
          {tooltip && (
            <EinTooltip content={tooltip}>
              <EinButton variant="tertiary" className="tooltip-trigger">
                <QuestionmarkIcon fontSize="1.5rem" />
              </EinButton>
            </EinTooltip>
          )}
        </Label>
      )}
      <Input {...props} ref={inputRef} />
      {errorMessage && <span>{errorMessage}</span>}
    </Field>
  );
};
