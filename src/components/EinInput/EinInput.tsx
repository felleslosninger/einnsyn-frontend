import {
	Field,
	Input,
	Label,
	type InputProps,
} from '@digdir/designsystemet-react';

import styles from './EinInput.module.css';
import cn from '~/lib/utils/className';

type EinInputProps = {
	fullWidth?: boolean;
	errorMessage?: string;
	label?: string;
	ref?: React.Ref<HTMLInputElement>;
};

export const EinInput = ({
	fullWidth = false,
	errorMessage,
	label,
	...props
}: InputProps & EinInputProps) => {
	return (
		<Field className={cn({ [styles['full-width']]: fullWidth })}>
			{label && <Label>{label}</Label>}
			<Input {...props} />
			{errorMessage && <span>{errorMessage}</span>}
		</Field>
	);
};
