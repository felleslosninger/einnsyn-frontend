import { capitalize } from '~/lib/utils/stringutils';

export const EinField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="fieldWrapper">
      <span className="fieldLabel">{capitalize(label)}: </span>
      <span className="fieldData">{value}</span>
    </div>
  );
};
