import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

// Checked against the theme's own values, so a palette or theme change can't
// quietly take a chart below WCAG 1.4.11's 3:1 for graphics.

const stylesheet = readFileSync(
  'src/components/EinChart/EinChart.module.scss',
  'utf8',
);
const theme = readFileSync(
  'src/styles/designsystemetColorOverrides.scss',
  'utf8',
);

/** The body of the first block after `selector`, nested blocks included. */
function block(css: string, selector: string): string {
  const start = css.indexOf('{', css.indexOf(selector));
  assert.ok(css.includes(selector), `no block for ${selector}`);
  let depth = 0;
  for (let index = start; index < css.length; index++) {
    if (css[index] === '{') {
      depth++;
    } else if (css[index] === '}' && --depth === 0) {
      return css.slice(start + 1, index);
    }
  }
  throw new Error(`unclosed block for ${selector}`);
}

/** Slot number to value, e.g. 1 → "var(--ds-color-accent-base-default)". */
function palette(body: string): Map<number, string> {
  return new Map(
    Array.from(
      body.matchAll(/--ein-chart-color-(\d+):([^;]+);/g),
      ([, slot, value]) => [Number(slot), value.replace(/\s+/g, ' ').trim()],
    ),
  );
}

function tokenValue(body: string, token: string): string {
  const match = body.match(
    new RegExp(`--ds-color-${token}:\\s*(#[0-9a-fA-F]{6});`),
  );
  assert.ok(match, `--ds-color-${token} is not set`);
  return match[1];
}

/** A slot's colour in linear sRGB. */
function colour(tokens: string, value: string): number[] {
  const token = value.match(/^var\(--ds-color-([a-z0-9-]+)\)$/);
  assert.ok(token, `can't check ${value}`);
  return linear(tokenValue(tokens, token[1]));
}

/** `color-mix(in oklab, rgb share, surface)`. */
function mix(rgb: number[], share: number, surface: number[]): number[] {
  const [from, to] = [oklab(rgb), oklab(surface)];
  return fromOklab(
    from.map((value, index) => value * share + to[index] * (1 - share)),
  );
}

function linear(hex: string): number[] {
  return [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
}

// Björn Ottosson's matrices, between linear sRGB and OKLab.
function oklab([r, g, b]: number[]): number[] {
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([lightness, a, b]: number[]): number[] {
  const [l, m, s] = [
    lightness + 0.3963377774 * a + 0.2158037573 * b,
    lightness - 0.1055613458 * a - 0.0638541728 * b,
    lightness - 0.0894841775 * a - 1.291485548 * b,
  ].map((value) => value ** 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function luminance([r, g, b]: number[]): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number[], b: number[]): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

const chartBlock = block(stylesheet, '.chart {');
const chartPalette = palette(chartBlock);

const paler = stylesheet.match(
  /color-mix\(in oklab, var\(--ein-chart-color\) (\d+)%, #\{\$surface\}\)/,
);
assert.ok(paler, 'no paler bar colour');
const palerShare = Number(paler[1]) / 100;

// The theme sets each token per scheme, so the one palette is checked in all.
const schemes = [
  ['light', "[data-color-scheme='light'] {"],
  ['light, from the system', '@media (prefers-color-scheme: light)'],
  ['dark', "[data-color-scheme='dark'] {"],
  ['dark, from the system', '@media (prefers-color-scheme: dark)'],
].map(([name, selector]) => ({ name, tokens: block(theme, selector) }));

describe('EinChart palette', () => {
  test('has three colours', () => {
    assert.deepStrictEqual([...chartPalette.keys()], [1, 2, 3]);
  });

  // An override elsewhere, say for dark mode, would go unchecked.
  test('is only set in .chart', () => {
    const declarations = /--ein-chart-color-\d+:/g;
    assert.strictEqual(
      stylesheet.match(declarations)?.length,
      chartBlock.match(declarations)?.length,
    );
  });

  // The page, and a tinted surface such as the mobile panel's Details. Lines
  // and overlays are kept apart from bars by the surface colour, so only the
  // surface has to contrast with each colour.
  const surfaces = ['neutral-background-default', 'neutral-surface-tinted'];

  for (const { name, tokens } of schemes) {
    for (const surfaceToken of surfaces) {
      const surface = linear(tokenValue(tokens, surfaceToken));

      test(`${name}: every colour is 3:1 against ${surfaceToken}`, () => {
        for (const value of chartPalette.values()) {
          const full = colour(tokens, value);
          for (const [shade, rgb] of [
            ['in full', full],
            ['paler', mix(full, palerShare, surface)],
          ] as const) {
            const ratio = contrast(rgb, surface);
            assert.ok(
              ratio >= 3,
              `${value} ${shade} on ${surfaceToken}: ${ratio.toFixed(2)}`,
            );
          }
        }
      });
    }
  }
});
