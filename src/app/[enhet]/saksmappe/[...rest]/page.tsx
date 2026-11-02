import { MappePlaceholder } from '../../MappePlaceholder';

export default function SaksmappePlaceholderPage({
  params,
}: {
  params: Promise<{ enhet: string; rest: string[] }>;
}) {
  return <MappePlaceholder mappe="saksmappe" params={params} />;
}
