import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  mergeTrimmedEnhetsWithAncestors,
  sortTrimmedEnhetsForSelector,
  type TrimmedEnhet,
} from './trimmedEnhetUtils';

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
    entity: 'Enhet',
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

describe('trimmedEnhetUtils', () => {
  test('mergeTrimmedEnhetsWithAncestors includes ancestors up to the top-level node', () => {
    const root = makeEnhet('root');
    const dummyRoot = makeEnhet('dummy-root', { parent: root.id });
    const branch = makeEnhet('branch', { parent: dummyRoot.id });
    const leaf = makeEnhet('leaf', { parent: branch.id });

    const merged = mergeTrimmedEnhetsWithAncestors(
      [leaf],
      [root, dummyRoot, branch, leaf],
    );

    assert.deepStrictEqual(
      merged.map((enhet) => enhet.id),
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
