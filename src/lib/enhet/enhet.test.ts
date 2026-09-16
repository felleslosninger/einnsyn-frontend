import assert from 'node:assert';
import { describe, test } from 'node:test';

import type { Enhet } from '@digdir/einnsyn-sdk';
import {
  expandTrimmedEnhetsWithAncestors,
  matchesEnhetIdentifier,
  selectInitialEnhets,
  sortTrimmedEnhetsForSelector,
  type TrimmedEnhet,
  toTrimmedEnhet,
} from './enhet';

function makeEnhet(
  id: string,
  {
    parent,
    navn = id,
    navnEngelsk,
    enhetstype = 'ADMINISTRATIVENHET',
  }: {
    parent?: string;
    navn?: string;
    navnEngelsk?: string;
    enhetstype?: TrimmedEnhet['enhetstype'];
  } = {},
): TrimmedEnhet {
  return {
    id,
    slug: id,
    orgnummer: id,
    navn,
    navnNynorsk: undefined,
    navnEngelsk,
    navnSami: undefined,
    enhetstype,
    parent,
  };
}

describe('enhetUtils', () => {
  test('expandTrimmedEnhetsWithAncestors includes ancestors up to the top-level node', () => {
    const root = makeEnhet('root');
    const dummyRoot = makeEnhet('dummy-root', { parent: root.id });
    const branch = makeEnhet('branch', { parent: dummyRoot.id });
    const leaf = makeEnhet('leaf', { parent: branch.id });

    const expanded = expandTrimmedEnhetsWithAncestors(
      [leaf],
      [root, dummyRoot, branch, leaf],
    );

    assert.deepStrictEqual(
      expanded.map((enhet) => enhet.id),
      ['leaf', 'branch', 'dummy-root'],
    );
  });

  test('sortTrimmedEnhetsForSelector uses the active language for tie-breaking', () => {
    const root = makeEnhet('root');
    const alphaInEnglish = makeEnhet('1', {
      parent: root.id,
      navn: 'Zulu',
      navnEngelsk: 'Alpha',
    });
    const zuluInEnglish = makeEnhet('2', {
      parent: root.id,
      navn: 'Alpha',
      navnEngelsk: 'Zulu',
    });

    assert.deepStrictEqual(
      sortTrimmedEnhetsForSelector(
        [root, alphaInEnglish, zuluInEnglish],
        'nb',
      ).map((enhet) => enhet.id),
      ['2', '1'],
    );
    assert.deepStrictEqual(
      sortTrimmedEnhetsForSelector(
        [root, alphaInEnglish, zuluInEnglish],
        'en',
      ).map((enhet) => enhet.id),
      ['1', '2'],
    );
  });
});

describe('toTrimmedEnhet', () => {
  const full = {
    id: 'enh_1',
    entity: 'Enhet',
    deleted: false,
    slug: 'oslo-kommune',
    navn: 'Oslo kommune',
    orgnummer: '123456789',
    kontaktpunktEpost: 'post@oslo.no',
    kontaktpunktTelefon: '12345678',
    innsynskravEpost: 'innsyn@oslo.no',
    enhetstype: 'KOMMUNE',
  } satisfies Enhet;

  test('drops everything the client does not need', () => {
    const trimmed = toTrimmedEnhet(full);

    assert.ok(!('kontaktpunktEpost' in trimmed), 'contact fields are dropped');
    assert.equal(trimmed.navn, 'Oslo kommune');
    assert.equal(trimmed.slug, 'oslo-kommune');
  });

  test('collapses an expanded parent to its id', () => {
    const parent = { ...full, id: 'enh_parent', navn: 'Parent' };

    assert.equal(toTrimmedEnhet({ ...full, parent }).parent, 'enh_parent');
    assert.equal(toTrimmedEnhet({ ...full, parent: 'enh_x' }).parent, 'enh_x');
    assert.equal(toTrimmedEnhet(full).parent, undefined);
  });
});

describe('matchesEnhetIdentifier', () => {
  const enhet = { id: 'enh_1', slug: 'oslo-kommune' };

  test('matches on slug, which the API `ids` filter cannot resolve', () => {
    assert.equal(
      matchesEnhetIdentifier(enhet, new Set(['oslo-kommune'])),
      true,
    );
  });

  test('matches on id', () => {
    assert.equal(matchesEnhetIdentifier(enhet, new Set(['enh_1'])), true);
  });

  test('does not match an unrelated identifier, or a slug-less enhet', () => {
    assert.equal(matchesEnhetIdentifier(enhet, new Set(['bergen'])), false);
    assert.equal(
      matchesEnhetIdentifier({ id: 'enh_2' }, new Set(['oslo-kommune'])),
      false,
    );
  });
});

describe('selectInitialEnhets', () => {
  const root = makeEnhet('root');
  const parent = makeEnhet('parent', { parent: root.id });
  const child = makeEnhet('child', { parent: parent.id });
  const other = makeEnhet('other', { parent: root.id });
  const all = [root, parent, child, other];

  test('includes the selected enhet and the ancestors that reach it', () => {
    const ids = selectInitialEnhets(all, new Set(['child']), 0, 'nb').map(
      (enhet) => enhet.id,
    );

    assert.ok(ids.includes('child'), 'the selected enhet');
    assert.ok(ids.includes('parent'), 'its ancestor, so the tree connects');
  });

  test('adds top suggestions beyond the selected branch', () => {
    const branchOnly = selectInitialEnhets(all, new Set(['child']), 0, 'nb');
    const withSuggestions = selectInitialEnhets(
      all,
      new Set(['child']),
      10,
      'nb',
    );

    assert.ok(
      withSuggestions.length > branchOnly.length,
      'the limit pulls in enhets outside the selected branch',
    );
  });
});
