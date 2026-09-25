import assert from 'node:assert';
import { describe, test } from 'node:test';

import type { Enhet } from '@digdir/einnsyn-sdk';
import {
  expandAncestorsInEnhetList,
  getAncestors,
  getEnhetHref,
  getEnhetIdentifier,
  matchesEnhetIdentifier,
  type TrimmedEnhet,
  toTrimmedEnhet,
} from './enhet';

function makeEnhet(
  id: string,
  {
    parent,
    navn = id,
    enhetstype = 'ADMINISTRATIVENHET',
  }: {
    parent?: string;
    navn?: string;
    enhetstype?: TrimmedEnhet['enhetstype'];
  } = {},
): TrimmedEnhet {
  return {
    id,
    slug: id,
    orgnummer: id,
    navn,
    navnNynorsk: undefined,
    navnEngelsk: undefined,
    navnSami: undefined,
    enhetstype,
    parent,
  };
}

describe('enhetUtils', () => {
  test('expandAncestorsInEnhetList includes ancestors up to the top-level node', () => {
    const root = makeEnhet('root');
    const dummyRoot = makeEnhet('dummy-root', { parent: root.id });
    const branch = makeEnhet('branch', { parent: dummyRoot.id });
    const leaf = makeEnhet('leaf', { parent: branch.id });

    const expanded = expandAncestorsInEnhetList(
      [leaf],
      [root, dummyRoot, branch, leaf],
    );

    assert.deepStrictEqual(
      expanded.map((enhet) => enhet.id),
      ['leaf', 'branch', 'dummy-root'],
    );
  });

  test('a parent cycle terminates instead of recursing forever', () => {
    const a = makeEnhet('a', { parent: 'b' });
    const b = makeEnhet('b', { parent: 'a' });

    assert.deepStrictEqual(
      expandAncestorsInEnhetList([a], [a, b]).map((enhet) => enhet.id),
      ['a', 'b'],
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

describe('getEnhetIdentifier', () => {
  test('prefers the slug, and falls back to the id without one', () => {
    assert.equal(getEnhetIdentifier({ id: 'enh_1', slug: 'oslo' }), 'oslo');
    assert.equal(getEnhetIdentifier({ id: 'enh_1' }), 'enh_1');
  });

  test('treats an empty slug as no slug', () => {
    assert.equal(getEnhetIdentifier({ id: 'enh_1', slug: '' }), 'enh_1');
    assert.equal(getEnhetHref({ id: 'enh_1', slug: '' }), '/enh_1');
  });
});

describe('matchesEnhetIdentifier', () => {
  const enhet = { id: 'enh_1', slug: 'oslo-kommune' };

  test('matches on slug', () => {
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

  test('does not match an empty slug', () => {
    assert.equal(
      matchesEnhetIdentifier({ id: 'enh_2', slug: '' }, new Set([''])),
      false,
    );
  });
});

describe('getAncestors', () => {
  // getAncestors walks expanded parent objects, while makeEnhet links parents
  // by id, so the chain is stitched together here.
  const chain = (
    ...links: [id: string, enhetstype?: TrimmedEnhet['enhetstype']][]
  ): TrimmedEnhet => {
    let current: TrimmedEnhet | undefined;
    for (const [id, enhetstype] of links) {
      current = { ...makeEnhet(id, { enhetstype }), parent: current };
    }
    return current as TrimmedEnhet;
  };

  test('lists ancestors outermost first, without the enhet or the root', () => {
    const leaf = chain(['root'], ['top'], ['mid'], ['leaf']);

    assert.deepStrictEqual(
      getAncestors(leaf).map((enhet) => enhet.id),
      ['top', 'mid'],
    );
  });

  test('is empty for an enhet directly below the root', () => {
    assert.deepStrictEqual(getAncestors(chain(['root'], ['top'])), []);
    assert.deepStrictEqual(getAncestors(chain(['root'])), []);
  });

  test('skips DUMMYENHET nodes anywhere in the chain', () => {
    const belowDummyRoot = chain(
      ['root'],
      ['dummy-root', 'DUMMYENHET'],
      ['branch'],
      ['leaf'],
    );
    const withDummyInTheMiddle = chain(
      ['root'],
      ['top'],
      ['dummy', 'DUMMYENHET'],
      ['leaf'],
    );

    assert.deepStrictEqual(
      getAncestors(belowDummyRoot).map((enhet) => enhet.id),
      ['branch'],
    );
    assert.deepStrictEqual(
      getAncestors(withDummyInTheMiddle).map((enhet) => enhet.id),
      ['top'],
    );
  });

  test('stops at a parent the API returned as a bare id', () => {
    const unexpandedLeaf = makeEnhet('leaf', { parent: 'mid' });
    const partiallyExpanded: TrimmedEnhet = {
      ...makeEnhet('leaf'),
      parent: makeEnhet('mid', { parent: 'top' }),
    };

    assert.deepStrictEqual(getAncestors(unexpandedLeaf), []);
    assert.deepStrictEqual(
      getAncestors(partiallyExpanded).map((enhet) => enhet.id),
      ['mid'],
    );
  });
});
