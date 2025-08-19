import { Button, type ButtonProps } from '@digdir/designsystemet-react';
import { forwardRef } from 'react';
import cn from '~/lib/utils/className';

import './EinButton.scss';

type EinButtonProps = {
  /**
   * If true, the button will take up the full width of its container.
   * @default false
   * */
  fullWidth?: boolean;

  style?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'destructive'
    | 'link'
    | 'custom';
};

export const EinButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & EinButtonProps
>(({ fullWidth = false, style = 'primary', ...props }, ref) => {
  return (
    <Button
      {...props}
      ref={ref}
      className={cn(props.className, 'ein-button', `style-${style}`, {
        'full-width': fullWidth,
      })}
    />
  );
});

EinButton.displayName = 'EinButton';
