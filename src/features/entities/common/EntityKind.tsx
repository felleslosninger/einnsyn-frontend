'use client';

import type {
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import {
  CalendarIcon,
  FileTextIcon,
  FolderFileIcon,
  TasklistIcon,
} from '@navikt/aksel-icons';
import type { ReactNode } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './EntityKind.module.scss';

type Entity = Journalpost | Moetemappe | Moetesak | Saksmappe;

const kinds: Record<Entity['entity'], { icon: ReactNode; labelKey: string }> = {
  Saksmappe: { icon: <FolderFileIcon />, labelKey: 'saksmappe.label' },
  Journalpost: { icon: <FileTextIcon />, labelKey: 'journalpost.label' },
  Moetemappe: { icon: <CalendarIcon />, labelKey: 'moetemappe.label' },
  Moetesak: { icon: <TasklistIcon />, labelKey: 'moetesak.label' },
};

export default function EntityKind({ entity }: { entity: Entity }) {
  const t = useTranslation();
  const { icon, labelKey } = kinds[entity.entity];

  return (
    <div
      className={cn(styles.kind, styles[`kind-${entity.entity.toLowerCase()}`])}
    >
      <span className={styles.kindIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.kindLabel}>{t(labelKey)}</span>
    </div>
  );
}
