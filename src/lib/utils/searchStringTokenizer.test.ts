import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  type SearchToken,
  searchQueryToTokens,
  tokensToSearchQuery,
} from './searchStringTokenizer';

const defaultToken: SearchToken = {
  value: '',
  quoted: false,
  prefix: undefined,
  sign: undefined,
  focused: false,
};

const t = (token: Partial<SearchToken>): SearchToken => ({
  ...defaultToken,
  ...token,
});

describe('searchQueryToTokens', () => {
  test('single words', () => {
    const result = searchQueryToTokens('single words');
    assert.deepStrictEqual(result, [
      t({ value: 'single' }),
      t({ value: 'words' }),
    ]);
  });

  test('quotes', () => {
    const result = searchQueryToTokens('"quotes" "should skip spaces"');
    assert.deepStrictEqual(result, [
      t({ value: 'quotes', quoted: true }),
      t({ value: 'should skip spaces', quoted: true }),
    ]);
  });

  test('prefix', () => {
    const result = searchQueryToTokens(
      'prefix:prefixed prefix2:"prefixed sequence"',
    );
    assert.deepStrictEqual(result, [
      t({ value: 'prefixed', prefix: 'prefix' }),
      t({ value: 'prefixed sequence', prefix: 'prefix2', quoted: true }),
    ]);
  });

  test('mix', () => {
    const result = searchQueryToTokens(
      'prefix:prefixed word prefix2:"prefixed sequence" "word" "se quence" "prefix:foo" pre:"ba" b',
    );
    assert.deepStrictEqual(result, [
      t({ value: 'prefixed', prefix: 'prefix' }),
      t({ value: 'word' }),
      t({ value: 'prefixed sequence', prefix: 'prefix2', quoted: true }),
      t({ value: 'word', quoted: true }),
      t({ value: 'se quence', quoted: true }),
      t({ value: 'prefix:foo', quoted: true }),
      t({ value: 'ba', prefix: 'pre', quoted: true }),
      t({ value: 'b' }),
    ]);
  });

  test('un-closed quotes', () => {
    const result = searchQueryToTokens('"foo bar');
    assert.deepStrictEqual(result, [t({ value: '"foo' }), t({ value: 'bar' })]);
  });

  test('un-closed prefixed quotes', () => {
    const result = searchQueryToTokens('pre:"foo bar');
    assert.deepStrictEqual(result, [
      t({ value: '"foo', prefix: 'pre' }),
      t({ value: 'bar' }),
    ]);
  });

  test('quotes in the middle of a word', () => {
    const result = searchQueryToTokens('this"is a"quote test');
    assert.deepStrictEqual(result, [
      t({ value: 'this"is' }),
      t({ value: 'a"quote' }),
      t({ value: 'test' }),
    ]);
  });

  test('quotes in the middle of a string', () => {
    const result = searchQueryToTokens('this"is "a quote');
    assert.deepStrictEqual(result, [
      t({ value: 'this"is' }),
      t({ value: '"a' }),
      t({ value: 'quote' }),
    ]);
  });

  test('double spaces', () => {
    const result = searchQueryToTokens('foo  bar');
    assert.deepStrictEqual(result, [
      t({ value: 'foo' }),
      t({ value: '' }),
      t({ value: 'bar' }),
    ]);
  });

  test('multiple colons', () => {
    const result = searchQueryToTokens(
      'unit:http://data.oslo.kommune.no/virksomhet/osloKommune+',
    );
    assert.deepStrictEqual(result, [
      t({
        prefix: 'unit',
        value: 'http://data.oslo.kommune.no/virksomhet/osloKommune+',
      }),
    ]);
  });

  test('single space', () => {
    const result = searchQueryToTokens(' ');
    assert.deepStrictEqual(result, [t({ value: '' }), t({ value: '' })]);
  });

  test('space at the end of string', () => {
    const result = searchQueryToTokens('test ');
    assert.deepStrictEqual(result, [t({ value: 'test' }), t({ value: '' })]);
  });

  test('escaped quotes', () => {
    const result = searchQueryToTokens('foo "bar\\"baz"');
    assert.deepStrictEqual(result, [
      t({ value: 'foo' }),
      t({ value: 'bar"baz', quoted: true }),
    ]);
  });
});

describe('tokensToSearchQuery', () => {
  test('single words', () => {
    const result = tokensToSearchQuery([
      { value: 'single' },
      { value: 'words' },
    ]);
    assert.strictEqual(result, 'single words');
  });

  test('quotes', () => {
    const result = tokensToSearchQuery([
      { value: 'quotes', quoted: true },
      { value: 'should skip spaces', quoted: true },
    ]);
    assert.strictEqual(result, '"quotes" "should skip spaces"');
  });

  test('prefix', () => {
    const result = tokensToSearchQuery([
      { value: 'prefixed', prefix: 'prefix' },
      { value: 'prefixed sequence', prefix: 'prefix2', quoted: true },
    ]);
    assert.strictEqual(result, 'prefix:prefixed prefix2:"prefixed sequence"');
  });

  test('mix', () => {
    const result = tokensToSearchQuery([
      { value: 'prefixed', prefix: 'prefix' },
      { value: 'word' },
      { value: 'prefixed sequence', prefix: 'prefix2', quoted: true },
      { value: 'word', quoted: true },
      { value: 'se quence', quoted: true },
      { value: 'prefix:foo', quoted: true },
      { value: 'ba', prefix: 'pre', quoted: true },
      { value: 'b' },
    ]);
    assert.strictEqual(
      result,
      'prefix:prefixed word prefix2:"prefixed sequence" "word" "se quence" "prefix:foo" pre:"ba" b',
    );
  });

  test('un-closed quotes', () => {
    const result = tokensToSearchQuery([{ value: '"foo' }, { value: 'bar' }]);
    assert.strictEqual(result, '"foo bar');
  });

  test('un-closed prefixed quotes', () => {
    const result = tokensToSearchQuery([
      { value: '"foo', prefix: 'pre' },
      { value: 'bar' },
    ]);
    assert.strictEqual(result, 'pre:"foo bar');
  });

  test('quotes in the middle of a word', () => {
    const result = tokensToSearchQuery([
      { value: 'this"is' },
      { value: 'a"quote' },
      { value: 'test' },
    ]);
    assert.strictEqual(result, 'this"is a"quote test');
  });

  test('quotes in the middle of a string', () => {
    const result = tokensToSearchQuery([
      { value: 'this"is' },
      { value: '"a' },
      { value: 'quote' },
    ]);
    assert.strictEqual(result, 'this"is "a quote');
  });

  test('double spaces', () => {
    const result = tokensToSearchQuery([
      { value: 'foo' },
      { value: '' },
      { value: 'bar' },
    ]);
    assert.strictEqual(result, 'foo  bar');
  });

  test('multiple colons', () => {
    const result = tokensToSearchQuery([
      {
        prefix: 'unit',
        value: 'http://data.oslo.kommune.no/virksomhet/osloKommune+',
      },
    ]);
    assert.strictEqual(
      result,
      'unit:http://data.oslo.kommune.no/virksomhet/osloKommune+',
    );
  });

  test('escaped quotes', () => {
    const result = tokensToSearchQuery([
      { value: 'foo' },
      { value: 'bar"baz', quoted: true },
    ]);
    assert.strictEqual(result, 'foo "bar\\"baz"');
  });
});

describe('search string tokenizer round trip', () => {
  const strings = [
    'single words',
    '"quotes" "should skip spaces"',
    'prefix:prefixed prefix2:"prefixed sequence"',
    'prefix:prefixed word prefix2:"prefixed sequence" "word" "se quence" "prefix:foo" pre:"ba" b',
    '"foo bar',
    'pre:"foo bar',
    'this"is a"quote test',
    'this"is "a quote',
    'foo  bar',
    'unit:http://data.oslo.kommune.no/virksomhet/osloKommune+',
    ' ',
    'test ',
    'foo "bar\\"baz"',
    'a:b "c\\"d" e',
    '',
  ];

  for (const str of strings) {
    test(`should convert to tokens and back to string: ${str}`, () => {
      const tokens = searchQueryToTokens(str);
      const result = tokensToSearchQuery(tokens);
      assert.strictEqual(result, str);
    });
  }
});
