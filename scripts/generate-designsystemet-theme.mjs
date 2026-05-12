import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const seeds = {
  accent: '#0062BA',
  brand1: '#0D7A5F',
  brand2: '#5B3FA0',
  neutral: '#24272B',
  info: '#0A71C0',
  success: '#068718',
  warning: '#EA9B1B',
  danger: '#C01B1B',
};

const lightSlots = {
  'background-default': { L: 1, Cf: 0, Cmax: 0 },
  'background-tinted': { L: 0.985, Cf: 0.1, Cmax: 0.025 },
  'surface-default': { L: 1, Cf: 0, Cmax: 0 },
  'surface-tinted': { L: 0.955, Cf: 0.18, Cmax: 0.035 },
  'surface-hover': { L: 0.92, Cf: 0.25, Cmax: 0.05 },
  'surface-active': { L: 0.875, Cf: 0.32, Cmax: 0.07 },
  'border-subtle': { L: 0.78, Cf: 0.42, Cmax: 0.09 },
  'border-default': { L: 0.56, Cf: 0.78, Cmax: 0.16 },
  'border-strong': { L: 0.48, Cf: 0.92, Cmax: 0.2 },
  'text-subtle': { L: 0.46, Cf: 0.75, Cmax: 0.16 },
  'text-default': { L: 0.36, Cf: 0.58, Cmax: 0.13 },
};

const darkSlots = {
  'background-default': { L: 0.18, Cf: 0.18, Cmax: 0.03 },
  'background-tinted': { L: 0.21, Cf: 0.22, Cmax: 0.04 },
  'surface-default': { L: 0.24, Cf: 0.28, Cmax: 0.05 },
  'surface-tinted': { L: 0.285, Cf: 0.34, Cmax: 0.06 },
  'surface-hover': { L: 0.34, Cf: 0.4, Cmax: 0.075 },
  'surface-active': { L: 0.4, Cf: 0.46, Cmax: 0.09 },
  'border-subtle': { L: 0.52, Cf: 0.55, Cmax: 0.11 },
  'border-default': { L: 0.68, Cf: 0.64, Cmax: 0.13 },
  'border-strong': { L: 0.79, Cf: 0.56, Cmax: 0.11 },
  'text-subtle': { L: 0.82, Cf: 0.42, Cmax: 0.08 },
  'text-default': { L: 0.93, Cf: 0.14, Cmax: 0.028 },
};

const semanticNames = [
  'background-default',
  'background-tinted',
  'surface-default',
  'surface-tinted',
  'surface-hover',
  'surface-active',
  'border-subtle',
  'border-default',
  'border-strong',
  'text-subtle',
  'text-default',
  'base-default',
  'base-hover',
  'base-active',
  'base-contrast-subtle',
  'base-contrast-default',
];

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return [0, 2, 4].map((i) => Number.parseInt(normalized.slice(i, i + 2), 16) / 255);
}

function srgbToLinear(component) {
  return component <= 0.04045
    ? component / 12.92
    : ((component + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(component) {
  return component <= 0.0031308
    ? 12.92 * component
    : 1.055 * Math.pow(component, 1 / 2.4) - 0.055;
}

function rgbToOklab([r, g, b]) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ];
}

function oklabToRgb([L, a, b]) {
  const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = L - 0.0894841775 * a - 1.291485548 * b;

  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;

  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function rgbToHex([r, g, b]) {
  const toChannel = (value) =>
    Math.max(0, Math.min(255, Math.round(value * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${toChannel(r)}${toChannel(g)}${toChannel(b)}`;
}

function inGamut(rgb) {
  return rgb.every((value) => value >= 0 && value <= 1);
}

function toOklch(hex) {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return { L, C, h };
}

function fromOklch(L, C, h) {
  const hueInRadians = (h * Math.PI) / 180;
  const render = (chroma) =>
    oklabToRgb([
      L,
      chroma * Math.cos(hueInRadians),
      chroma * Math.sin(hueInRadians),
    ]);

  const firstAttempt = render(C);
  if (inGamut(firstAttempt)) {
    return rgbToHex(firstAttempt);
  }

  let min = 0;
  let max = C;
  for (let index = 0; index < 24; index += 1) {
    const mid = (min + max) / 2;
    if (inGamut(render(mid))) {
      min = mid;
    } else {
      max = mid;
    }
  }

  return rgbToHex(render(min));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(hex1, hex2) {
  const lum1 = luminance(hex1);
  const lum2 = luminance(hex2);
  const [high, low] = lum1 > lum2 ? [lum1, lum2] : [lum2, lum1];
  return (high + 0.05) / (low + 0.05);
}

function makeScale(seed, scheme) {
  const { L, C, h } = toOklch(seed);
  const slotDefinitions = scheme === 'light' ? lightSlots : darkSlots;
  const scale = {};

  for (const [tokenName, definition] of Object.entries(slotDefinitions)) {
    scale[tokenName] = fromOklch(
      definition.L,
      Math.min(C * definition.Cf, definition.Cmax),
      h,
    );
  }

  if (scheme === 'light') {
    const isDarkSeed = L < 0.35;
    const hoverL = Math.max(0, Math.min(1, L + (isDarkSeed ? 0.04 : -0.04)));
    const activeL = Math.max(0, Math.min(1, L + (isDarkSeed ? 0.08 : -0.08)));

    scale['base-default'] = seed;
    scale['base-hover'] = fromOklch(
      hoverL,
      Math.min(C * (isDarkSeed ? 0.85 : 1.02), 0.23),
      h,
    );
    scale['base-active'] = fromOklch(
      activeL,
      Math.min(C * (isDarkSeed ? 0.7 : 1.04), 0.25),
      h,
    );
  } else {
    const baseL = Math.max(L, 0.72);
    scale['base-default'] = fromOklch(baseL, Math.min(C * 0.85, 0.16), h);
    scale['base-hover'] = fromOklch(
      Math.min(0.78, baseL + 0.05),
      Math.min(C * 0.75, 0.14),
      h,
    );
    scale['base-active'] = fromOklch(
      Math.min(0.84, baseL + 0.1),
      Math.min(C * 0.65, 0.12),
      h,
    );
  }

  const useWhite = contrast(scale['base-default'], '#ffffff') >= contrast(scale['base-default'], '#000000');
  scale['base-contrast-default'] = useWhite ? '#ffffff' : '#000000';
  scale['base-contrast-subtle'] = useWhite
    ? fromOklch(0.96, Math.min(C * 0.08, 0.018), h)
    : fromOklch(0.22, Math.min(C * 0.18, 0.04), h);

  return scale;
}

function renderFamily(scale, family) {
  return semanticNames
    .map((tokenName) => `  --ds-color-${family}-${tokenName}: ${scale[tokenName]};`)
    .join('\n');
}

function renderBlock(selector, scheme) {
  const scales = Object.fromEntries(
    Object.entries(seeds).map(([family, seed]) => [family, makeScale(seed, scheme)]),
  );

  return [
    `${selector} {`,
    renderFamily(scales.accent, 'accent'),
    '',
    renderFamily(scales.brand1, 'brand1'),
    '',
    renderFamily(scales.brand2, 'brand2'),
    '',
    renderFamily(scales.neutral, 'neutral'),
    '',
    renderFamily(scales.info, 'info'),
    '',
    renderFamily(scales.success, 'success'),
    '',
    renderFamily(scales.warning, 'warning'),
    '',
    renderFamily(scales.danger, 'danger'),
    '',
    `  --ds-color-focus-inner: ${scales.neutral['background-default']};`,
    `  --ds-color-focus-outer: ${scales.neutral['text-default']};`,
    `  --ds-link-color-visited: ${scales.brand2['text-subtle']};`,
    '',
    `  color-scheme: ${scheme};`,
    '}',
  ].join('\n');
}

const output = [
  '/* Generated from the current Designsystemet seed colors using a local OKLCH-based ramp. */',
  '',
  renderBlock(":root,\n[data-color-scheme='light']", 'light'),
  '',
  '@media (prefers-color-scheme: light) {',
  renderBlock("  [data-color-scheme='auto']", 'light'),
  '}',
  '',
  renderBlock("[data-color-scheme='dark']", 'dark'),
  '',
  '@media (prefers-color-scheme: dark) {',
  renderBlock("  [data-color-scheme='auto']", 'dark'),
  '}',
  '',
].join('\n');

const outputPath = process.argv[2];
if (outputPath) {
  writeFileSync(resolve(outputPath), output);
} else {
  process.stdout.write(output);
}
