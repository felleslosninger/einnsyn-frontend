import { EinButton } from '~/components/EinButton/EinButton';
import type { EnhetNode } from './EnhetSelector';

export function EnhetSelectorSelectItem({
  enhetNode,
}: {
  enhetNode: EnhetNode;
}) {
  const enhet = enhetNode.enhet;
  return (
    <div className="enhet" key={enhet.id}>
      <EinButton>{enhet.name.nb}</EinButton>
    </div>
  );
}
