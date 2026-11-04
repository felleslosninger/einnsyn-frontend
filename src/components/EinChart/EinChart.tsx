'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { getIntlLocale } from '~/lib/translation/translation';
import cn from '~/lib/utils/className';
import { capitalize } from '~/lib/utils/stringutils';
import styles from './EinChart.module.scss';

export type EinChartSeries<T> = {
  label: string;
  type: 'bar' | 'line';
  value: (point: T) => number;
  /**
   * Series with the same scale are drawn against the same maximum.
   */
  scale?: string;
  /**
   * Draws the bars inside those of the nearest earlier bar series that isn't
   * an overlay, for a subset such as "of which with full text". Both should
   * share a scale.
   */
  overlay?: boolean;
  /** Shown while no point is active. Defaults to the sum of the values. */
  total?: (points: readonly T[]) => number;
  /** A CSS colour. Defaults to the palette colour for the series' position. */
  color?: string;
  /** Defaults to a number in the viewer's locale. */
  format?: (value: number) => string;
};

export type EinChartProps<T> = {
  points: readonly T[];
  /** The palette has three colours; a fourth series needs its own `color`. */
  series: readonly EinChartSeries<T>[];
  /**
   * Short labels mark the axis; long ones name the active point and the
   * table's rows, and must be unique.
   */
  pointLabel: (point: T, length: 'short' | 'long') => string;
  /** What a point is, e.g. "Month". Names the slider and the table column. */
  pointName: string;
  /** What the totals cover, e.g. "Last 12 months"; screen readers only. */
  caption: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

const percentOf = (value: number, max: number) =>
  max > 0 ? (value / max) * 100 : 0;

const barHeight = (percent: number) =>
  percent > 0 ? `max(2px, ${percent}%)` : 0;

const toColorStyle = (color: string) =>
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
  const [wantedIndex, setWantedIndex] = useState<number>();
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(getIntlLocale(languageCode)),
    [languageCode],
  );

  if (points.length === 0) {
    return null;
  }

  const lastIndex = points.length - 1;
  // If `points` is updated, the wanted index may be out of bounds.
  const activeIndex =
    wantedIndex !== undefined && wantedIndex <= lastIndex
      ? wantedIndex
      : undefined;
  const activePoint =
    activeIndex === undefined ? undefined : points[activeIndex];
  // sliderIndex is the keyboard / screen-reader position
  const sliderIndex = activeIndex ?? lastIndex;
  const longLabels = points.map((point) => pointLabel(point, 'long'));
  const formatValue = (entry: EinChartSeries<T>, value: number) =>
    entry.format ? entry.format(value) : numberFormat.format(value);

  // Find the maximum value for each scale
  const seriesValues = series.map((entry) => points.map(entry.value));
  const maxByScale = new Map<string | undefined, number>();
  series.forEach((entry, index) => {
    maxByScale.set(
      entry.scale,
      Math.max(maxByScale.get(entry.scale) ?? 0, ...seriesValues[index]),
    );
  });

  // Scale the values to percentages of the maximum for their scale, and
  // calculate the total for each series.
  const scaledSeries = series.map((entry, index) => ({
    entry,
    colorStyle: toColorStyle(
      entry.color ?? `var(--ein-chart-color-${index + 1})`,
    ),
    percents: seriesValues[index].map((value) =>
      percentOf(value, maxByScale.get(entry.scale) ?? 0),
    ),
    total: entry.total
      ? entry.total(points)
      : seriesValues[index].reduce((sum, value) => sum + value, 0),
  }));

  // Group bar series with overlays together
  const barGroups: {
    base: (typeof scaledSeries)[number];
    overlays: (typeof scaledSeries)[number][];
  }[] = [];
  for (const item of scaledSeries) {
    if (item.entry.type !== 'bar') {
      continue;
    }
    const lastGroup = barGroups.at(-1);
    if (item.entry.overlay && lastGroup) {
      lastGroup.overlays.push(item);
    } else {
      barGroups.push({ base: item, overlays: [] });
    }
  }

  const lineSeries = scaledSeries.filter(({ entry }) => entry.type === 'line');
  const columnCenter = (index: number) => ((index + 0.5) / points.length) * 100;

  // Build screen-reader summary text
  const summarize = (point: T) =>
    `${pointLabel(point, 'long')}: ${series
      .map(
        (entry) => `${entry.label} ${formatValue(entry, entry.value(point))}`,
      )
      .join(', ')}`;

  // Keyboard navigation
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setWantedIndex(undefined);
      return;
    }
    const targetIndexByKey: Partial<Record<string, number>> = {
      ArrowLeft: sliderIndex - 1,
      ArrowDown: sliderIndex - 1,
      ArrowRight: sliderIndex + 1,
      ArrowUp: sliderIndex + 1,
      Home: 0,
      End: lastIndex,
    };
    const targetIndex = targetIndexByKey[event.key];
    if (targetIndex === undefined) {
      return;
    }
    event.preventDefault();
    setWantedIndex(Math.min(Math.max(targetIndex, 0), lastIndex));
  };

  const HeadingTag = `h${headingLevel}` as const;

  return (
    <div className={cn(styles.chart, className)}>
      <HeadingTag
        className={cn(styles.caption, { 'ds-sr-only': !activePoint })}
      >
        {activePoint ? capitalize(pointLabel(activePoint, 'long')) : caption}
      </HeadingTag>
      <dl className={styles.legend}>
        {scaledSeries.map(({ entry, colorStyle, total }) => (
          <div key={entry.label} className={styles.legendItem}>
            <dt>
              <span
                className={
                  entry.type === 'bar' ? styles.barKey : styles.lineKey
                }
                style={colorStyle}
              />
              {entry.label}
            </dt>
            <dd>
              {formatValue(
                entry,
                activePoint ? entry.value(activePoint) : total,
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div
        className={cn(styles.plot, 'ds-focus')}
        // Lets keyboard and screen-reader users step through the points.
        role="slider"
        tabIndex={0}
        aria-label={pointName}
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={sliderIndex}
        aria-valuetext={summarize(points[sliderIndex])}
        onKeyDown={onKeyDown}
        onFocus={() => setWantedIndex((index) => index ?? lastIndex)}
        onBlur={() => setWantedIndex(undefined)}
        onPointerLeave={(event) => {
          // A tap fires pointerleave right away; keep the tapped point until
          // focus moves on.
          if (event.pointerType !== 'touch') {
            setWantedIndex(undefined);
          }
        }}
      >
        {longLabels.map((label, index) => (
          <div
            key={label}
            className={cn(styles.column, {
              [styles.active]: index === activeIndex,
            })}
            onPointerEnter={() => setWantedIndex(index)}
          >
            {barGroups.map(({ base, overlays }) => (
              <div
                key={base.entry.label}
                className={styles.bar}
                style={{
                  ...base.colorStyle,
                  height: barHeight(base.percents[index]),
                }}
              >
                {overlays.map((overlay) => (
                  <div
                    key={overlay.entry.label}
                    className={styles.overlay}
                    style={{
                      ...overlay.colorStyle,
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
          // One unit per column wide and 100 high, stretched over the plot.
          viewBox={`0 0 ${points.length} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {lineSeries.map(({ entry, colorStyle, percents }) => {
            const polylinePoints = percents
              .map((percent, index) => `${index + 0.5},${100 - percent}`)
              .join(' ');
            return (
              <g key={entry.label} style={colorStyle}>
                <polyline className={styles.halo} points={polylinePoints} />
                <polyline points={polylinePoints} />
              </g>
            );
          })}
        </svg>
        {activeIndex !== undefined &&
          lineSeries.map(({ entry, colorStyle, percents }) => (
            <div
              key={entry.label}
              // Outside the SVG, whose stretching would make the dots oval.
              className={styles.marker}
              style={{
                ...colorStyle,
                left: `${columnCenter(activeIndex)}%`,
                top: `${100 - percents[activeIndex]}%`,
              }}
            />
          ))}
      </div>
      {!activePoint && (
        <>
          <span className={styles.axisStart} aria-hidden="true">
            {pointLabel(points[0], 'short')}
          </span>
          <span className={styles.axisEnd} aria-hidden="true">
            {pointLabel(points[lastIndex], 'short')}
          </span>
        </>
      )}

      {/* Screen-reader table with all the numbers, and a caption for the chart. */}
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
                <td key={entry.label}>
                  {formatValue(entry, entry.value(point))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
