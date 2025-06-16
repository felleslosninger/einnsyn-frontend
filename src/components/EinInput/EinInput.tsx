import {
  Field,
  Input,
  Label,
  type InputProps,
} from '@digdir/designsystemet-react';

import styles from './EinInput.module.css';
import cn from '~/lib/utils/className';
import EinTooltip from '../EinTooltip/EinTooltip';
import { QuestionmarkCircleIcon } from '@navikt/aksel-icons';
import { EinButton } from '../EinButton/EinButton';

type EinInputProps = {
  fullWidth?: boolean;
  errorMessage?: string;
  label?: string;
  tooltip?: string;
  ref?: React.Ref<HTMLInputElement>;
};

export const EinInput = ({
  fullWidth = false,
  errorMessage,
  label,
  tooltip,
  ...props
}: InputProps & EinInputProps) => {
  return (
    <Field className={cn({ [styles['full-width']]: fullWidth })}>
      {label && (
        <Label>
          {label}
          {tooltip && (
            <EinTooltip content={tooltip}>
              <EinButton variant="tertiary">
                <QuestionmarkCircleIcon title="a11y-title" fontSize="1.5rem" />
              </EinButton>
            </EinTooltip>
          )}
        </Label>
      )}
      <Input {...props} />
      {errorMessage && <span>{errorMessage}</span>}
    </Field>
  );
};
