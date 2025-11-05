import { Checkbox } from '@digdir/designsystemet-react';
import type { EnhetNode } from './EnhetSelector';

export function EnhetSelectorSelectItem({
  enhetNode,
}: {
  enhetNode: EnhetNode;
}) {
  const enhet = enhetNode.enhet;
  return (
    <div className="enhet" key={enhet.id}>
      <Checkbox
        key={enhet.id}
        value={enhet.id}
        //label={getName(node.enhet)}
        label={enhet.name.nb}
      />
    </div>
  );
}
