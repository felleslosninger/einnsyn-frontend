import { Button, type ButtonProps } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';

import styles from './EinButton.module.css';

type EinButtonProps = {
	/**
	 * If true, the button will take up the full width of its container.
	 * @default false
	 * */
	fullWidth?: boolean;
};

export const EinButton = ({
	fullWidth = false,
	...props
}: ButtonProps & EinButtonProps) => {
	return (
		<Button
			{...props}
			className={cn(props.className, {
				[styles['full-width']]: fullWidth,
			})}
		/>
	);
};
