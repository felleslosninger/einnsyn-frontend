'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { getIntlLocale } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import styles from './EinChart.module.scss';

export type EinChartSeries<T> = {
  label: string;
  type: 'bar' | 'line';
  value: (point: T) => number;
  /**
   * Series without a scale share one, and so do series with the same scale.
   * A scale no other series uses gives this one its own.
   */
  scale?: string;
  /**
   * Draws the bars inside those of the bar series before it in `series`, for a
   * subset such as "of which with full text". Both should share a scale.
   */
  overlay?: boolean;
  /** Shown while no point is active. Defaults to the sum of the values. */
  total?: number;
  /** A CSS colour. Defaults to the palette colour for the series' position. */
  color?: string;
  /** Defaults to a number in the viewer's locale. */
  format?: (value: number) => string;
};

export type EinChartProps<T> = {
  points: readonly T[];
  /** The palette has three colours; a fourth series needs its own `color`. */
  series: readonly EinChartSeries<T>[];
  /** Short labels mark the axis; long ones name the active point. Must be unique. */
  pointLabel: (point: T, length: 'short' | 'long') => string;
  /** What a point is, e.g. "Month". Names the slider and the table column. */
  pointName: string;
  /** Names the totals for screen readers, e.g. "Last 12 months". */
  caption: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const percentOf = (value: number, max: number) =>
  max > 0 ? (value / max) * 100 : 0;

const barHeight = (percent: number) =>
  percent > 0 ? `max(2px, ${percent}%)` : 0;

const colorStyle = (color: string) =>
  ({ '--ein-chart-color': color }) as CSSProperties;

/**
 * Bars and lines without value axes: the legend shows each series' total, or
 * the active point's values, and a screen-reader table holds every number.
 */
export default function EinChart<T>({
  points,
  series,
  pointLabel,
  pointName,
  caption,
  headingLevel = 3,
  className,
}: EinChartProps<T>) {
  const languageCode = useLanguageCode();
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(getIntlLocale(languageCode)),
    [languageCode],
  );

  if (points.length === 0) {
    return null;
  }

  const lastIndex = points.length - 1;
  // The points can change under a selected index.
  const activeIndex =
    selectedIndex !== undefined && selectedIndex <= lastIndex
      ? selectedIndex
      : undefined;
  const active = activeIndex === undefined ? undefined : points[activeIndex];
  // The slider rests on the last point.
  const sliderIndex = activeIndex ?? lastIndex;
  const longLabels = points.map((point) => pointLabel(point, 'long'));
  const format = (entry: EinChartSeries<T>, value: number) =>
    entry.format ? entry.format(value) : numberFormat.format(value);

  const values = series.map((entry) => points.map(entry.value));
  const maxByScale = new Map<string | undefined, number>();
  series.forEach((entry, index) => {
    maxByScale.set(
      entry.scale,
      Math.max(maxByScale.get(entry.scale) ?? 0, ...values[index]),
    );
  });

  const scaled = series.map((entry, index) => ({
    entry,
    color: colorStyle(entry.color ?? `var(--ein-chart-color-${index + 1})`),
    percents: values[index].map((value) =>
      percentOf(value, maxByScale.get(entry.scale) ?? 0),
    ),
    total: entry.total ?? values[index].reduce((sum, value) => sum + value, 0),
  }));

  const barGroups: {
    base: (typeof scaled)[number];
    overlays: (typeof scaled)[number][];
  }[] = [];
  for (const item of scaled) {
    if (item.entry.type !== 'bar') {
      continue;
    }
    const group = barGroups.at(-1);
    if (item.entry.overlay && group) {
      group.overlays.push(item);
    } else {
      barGroups.push({ base: item, overlays: [] });
    }
  }
  const lines = scaled.filter(({ entry }) => entry.type === 'line');
  const columnCenter = (index: number) => ((index + 0.5) / points.length) * 100;

  const summarize = (point: T) =>
    `${pointLabel(point, 'long')}: ${series
      .map((entry) => `${entry.label} ${format(entry, entry.value(point))}`)
      .join(', ')}`;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelectedIndex(undefined);
      return;
    }
    const targets: Partial<Record<string, number>> = {
      ArrowLeft: sliderIndex - 1,
      ArrowDown: sliderIndex - 1,
      ArrowRight: sliderIndex + 1,
      ArrowUp: sliderIndex + 1,
      Home: 0,
      End: lastIndex,
    };
    const next = targets[event.key];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    setSelectedIndex(Math.min(Math.max(next, 0), lastIndex));
  };

  const Caption = `h${headingLevel}` as const;

  return (
    <div className={cn(styles.chart, className)}>
      <Caption className={cn(styles.caption, { 'ds-sr-only': !active })}>
        {active ? pointLabel(active, 'long') : caption}
      </Caption>
      <dl className={styles.legend}>
        {scaled.map(({ entry, color, total }) => (
          <div key={entry.label} className={styles.legendItem}>
            <dt>
              <span
                className={
                  entry.type === 'bar' ? styles.barKey : styles.lineKey
                }
                style={color}
              />
              {entry.label}
            </dt>
            <dd>{format(entry, active ? entry.value(active) : total)}</dd>
          </div>
        ))}
      </dl>

      <div
        className={cn(styles.plot, 'ds-focus')}
        role="slider"
        tabIndex={0}
        aria-label={pointName}
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={sliderIndex}
        aria-valuetext={summarize(points[sliderIndex])}
        onKeyDown={onKeyDown}
        onFocus={() => setSelectedIndex((index) => index ?? lastIndex)}
        onBlur={() => setSelectedIndex(undefined)}
        onPointerLeave={(event) => {
          // A tap leaves at once; keep its point until focus moves on.
          if (event.pointerType !== 'touch') {
            setSelectedIndex(undefined);
          }
        }}
      >
        {longLabels.map((label, index) => (
          <div
            key={label}
            className={cn(styles.column, {
              [styles.active]: index === activeIndex,
            })}
            onPointerEnter={() => setSelectedIndex(index)}
          >
            {barGroups.map(({ base, overlays }) => (
              <div
                key={base.entry.label}
                className={styles.bar}
                style={{
                  ...base.color,
                  height: barHeight(base.percents[index]),
                }}
              >
                {overlays.map((overlay) => (
                  <div
                    key={overlay.entry.label}
                    className={styles.overlay}
                    style={{
                      ...overlay.color,
                      // Relative to the bar it sits in.
                      height: barHeight(
                        percentOf(
                          overlay.percents[index],
                          base.percents[index],
                        ),
                      ),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
        <svg
          className={styles.lines}
          viewBox={`0 0 ${points.length} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {lines.map(({ entry, color, percents }) => {
            const linePoints = percents
              .map((percent, index) => `${index + 0.5},${100 - percent}`)
              .join(' ');
            return (
              <g key={entry.label} style={color}>
                <polyline className={styles.halo} points={linePoints} />
                <polyline points={linePoints} />
              </g>
            );
          })}
        </svg>
        {activeIndex !== undefined &&
          lines.map(({ entry, color, percents }) => (
            <div
              key={entry.label}
              className={styles.marker}
              style={{
                ...color,
                left: `${columnCenter(activeIndex)}%`,
                top: `${100 - percents[activeIndex]}%`,
              }}
            />
          ))}
      </div>
      {!active && (
        <>
          <span className={styles.axisStart} aria-hidden="true">
            {pointLabel(points[0], 'short')}
          </span>
          <span className={styles.axisEnd} aria-hidden="true">
            {pointLabel(points[lastIndex], 'short')}
          </span>
        </>
      )}

      <table className="ds-sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{pointName}</th>
            {series.map((entry) => (
              <th key={entry.label} scope="col">
                {entry.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr key={longLabels[index]}>
              <th scope="row">{longLabels[index]}</th>
              {series.map((entry) => (
                <td key={entry.label}>{format(entry, entry.value(point))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
