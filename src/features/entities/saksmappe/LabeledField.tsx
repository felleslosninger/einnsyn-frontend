import { capitalize } from '~/lib/utils/stringutils';

export const LabeledField = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className="fieldWrapper">
      <span className="fieldLabel">{capitalize(label)}: </span>
      {value && children === undefined && (
        <span className="fieldData">{value}</span>
      )}
      {children && <span className="fieldData">{children}</span>}
    </div>
  );
};
