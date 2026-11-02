import { MappePlaceholder } from '../../MappePlaceholder';

export default function MoetemappePlaceholderPage({
  params,
}: {
  params: Promise<{ enhet: string; rest: string[] }>;
}) {
  return <MappePlaceholder mappe="moetemappe" params={params} />;
}
