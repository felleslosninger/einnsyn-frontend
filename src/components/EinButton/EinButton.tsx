import { Button, type ButtonProps } from '@digdir/designsystemet-react';
import { forwardRef } from 'react';
import cn from '~/lib/utils/className';
import { capitalize } from '~/lib/utils/stringutils';
import styles from './EinButton.module.scss';

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
  const capitalizedStyle = capitalize(style);
  return (
    <Button
      {...props}
      ref={ref}
      className={cn(
        props.className,
        styles.einButton,
        styles[capitalizedStyle],
        'ein-button',
        {
          [styles.fullWidth]: fullWidth,
        },
      )}
    />
  );
});

EinButton.displayName = 'EinButton';
