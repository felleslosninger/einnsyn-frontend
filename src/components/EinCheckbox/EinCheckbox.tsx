import {
	type CheckboxProps,
	Checkbox,
	Field,
	Label,
} from '@digdir/designsystemet-react';

type EinCheckboxProps = {
	errorMessage?: string;
};

export const EinCheckbox = ({
	errorMessage,
	...props
}: CheckboxProps & EinCheckboxProps) => {
	return (
		<Field>
			<Checkbox {...props} />
			{errorMessage && <span>{errorMessage}</span>}
		</Field>
	);
};
