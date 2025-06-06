import { Button, type ButtonProps } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';

import './EinButton.scss';

type EinButtonProps = {
  /**
   * If true, the button will take up the full width of its container.
   * @default false
   * */
  fullWidth?: boolean;

  style?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'link';
};

export const EinButton = ({
  fullWidth = false,
  style = 'primary',
  ...props
}: ButtonProps & EinButtonProps) => {
  return (
    <Button
      {...props}
      className={cn(props.className, 'ein-button', `style-${style}`, {
        'full-width': fullWidth,
      })}
    />
  );
};
