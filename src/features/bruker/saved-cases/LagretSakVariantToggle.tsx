'use client';

import { ToggleGroup } from '@digdir/designsystemet-react';
import styles from './SavedCases.module.scss';

export type LagretSakVariant = 'title' | 'enhet' | 'compact' | 'search';

const VARIANTS: { value: LagretSakVariant; label: string }[] = [
  { value: 'title', label: 'Kun tittel' },
  { value: 'enhet', label: 'Virksomhet' },
  { value: 'compact', label: 'Kompakt' },
  { value: 'search', label: 'Som søkeresultat' },
];

export function LagretSakVariantToggle({
  value,
  onChange,
}: {
  value: LagretSakVariant;
  onChange: (value: LagretSakVariant) => void;
}) {
  return (
    <ToggleGroup
      data-size="sm"
      className={styles.variants}
      value={value}
      onChange={(variant) => onChange(variant as LagretSakVariant)}
      aria-label="Visning"
    >
      {VARIANTS.map((variant) => (
        <ToggleGroup.Item key={variant.value} value={variant.value}>
          {variant.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup>
  );
}
