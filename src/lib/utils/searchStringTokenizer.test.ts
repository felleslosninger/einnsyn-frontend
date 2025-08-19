import {
  searchQueryToTokens,
  tokensToSearchQuery,
} from './searchStringTokenizer';

describe('searchQueryToTokens', () => {
  test('single words', () => {
    const result = searchQueryToTokens('single words');
    expect(result).toEqual([{ value: 'single' }, { value: 'words' }]);
  });

  test('quotes', () => {
    const result = searchQueryToTokens('"quotes" "should skip spaces"');
    expect(result).toEqual([
      { value: 'quotes', quoted: true },
      { value: 'should skip spaces', quoted: true },
    ]);
  });

  test('prefix', () => {
    const result = searchQueryToTokens(
      'prefix:prefixed prefix2:"prefixed sequence"',
    );
    expect(result).toEqual([
      { value: 'prefixed', prefix: 'prefix' },
      { value: 'prefixed sequence', prefix: 'prefix2', quoted: true },
    ]);
  });

  test('mix', () => {
    const result = searchQueryToTokens(
      'prefix:prefixed word prefix2:"prefixed sequence" "word" "se quence" "prefix:foo" pre:"ba" b',
    );
    expect(result).toEqual([
      { value: 'prefixed', prefix: 'prefix' },
      { value: 'word' },
      { value: 'prefixed sequence', prefix: 'prefix2', quoted: true },
      { value: 'word', quoted: true },
      { value: 'se quence', quoted: true },
      { value: 'prefix:foo', quoted: true },
      { value: 'ba', prefix: 'pre', quoted: true },
      { value: 'b' },
    ]);
  });

  test('un-closed quotes', () => {
    const result = searchQueryToTokens('"foo bar');
    expect(result).toEqual([{ value: '"foo' }, { value: 'bar' }]);
  });

  test('un-closed prefixed quotes', () => {
    const result = searchQueryToTokens('pre:"foo bar');
    expect(result).toEqual([
      { value: '"foo', prefix: 'pre' },
      { value: 'bar' },
    ]);
  });

  test('quotes in the middle of a word', () => {
    const result = searchQueryToTokens('this"is a"quote test');
    expect(result).toEqual([
      { value: 'this"is' },
      { value: 'a"quote' },
      { value: 'test' },
    ]);
  });

  test('quotes in the middle of a string', () => {
    const result = searchQueryToTokens('this"is "a quote');
    expect(result).toEqual([
      { value: 'this"is' },
      { value: '"a' },
      { value: 'quote' },
    ]);
  });

  test('double spaces', () => {
    const result = searchQueryToTokens('foo  bar');
    expect(result).toEqual([{ value: 'foo' }, { value: '' }, { value: 'bar' }]);
  });

  test('multiple colons', () => {
    const result = searchQueryToTokens(
      'unit:http://data.oslo.kommune.no/virksomhet/osloKommune+',
    );
    expect(result).toEqual([
      {
        prefix: 'unit',
        value: 'http://data.oslo.kommune.no/virksomhet/osloKommune+',
      },
    ]);
  });

  test('single space', () => {
    const result = searchQueryToTokens(' ');
    expect(result).toEqual([{ value: '' }, { value: '' }]);
  });

  test('space at the end of string', () => {
    const result = searchQueryToTokens('test ');
    expect(result).toEqual([{ value: 'test' }, { value: '' }]);
  });

  test('escaped quotes', () => {
    const result = searchQueryToTokens('foo "bar\\"baz"');
    expect(result).toEqual([
      { value: 'foo' },
      { value: 'bar"baz', quoted: true },
    ]);
  });
});

describe('tokensToSearchQuery', () => {
  test('single words', () => {
    const result = tokensToSearchQuery([
      { value: 'single' },
      { value: 'words' },
    ]);
    expect(result).toEqual('single words');
  });

  test('quotes', () => {
    const result = tokensToSearchQuery([
      { value: 'quotes', quoted: true },
      { value: 'should skip spaces', quoted: true },
    ]);
    expect(result).toEqual('"quotes" "should skip spaces"');
  });

  test('prefix', () => {
    const result = tokensToSearchQuery([
      { value: 'prefixed', prefix: 'prefix' },
      { value: 'prefixed sequence', prefix: 'prefix2', quoted: true },
    ]);
    expect(result).toEqual('prefix:prefixed prefix2:"prefixed sequence"');
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
    expect(result).toEqual(
      'prefix:prefixed word prefix2:"prefixed sequence" "word" "se quence" "prefix:foo" pre:"ba" b',
    );
  });

  test('un-closed quotes', () => {
    const result = tokensToSearchQuery([{ value: '"foo' }, { value: 'bar' }]);
    expect(result).toEqual('"foo bar');
  });

  test('un-closed prefixed quotes', () => {
    const result = tokensToSearchQuery([
      { value: '"foo', prefix: 'pre' },
      { value: 'bar' },
    ]);
    expect(result).toEqual('pre:"foo bar');
  });

  test('quotes in the middle of a word', () => {
    const result = tokensToSearchQuery([
      { value: 'this"is' },
      { value: 'a"quote' },
      { value: 'test' },
    ]);
    expect(result).toEqual('this"is a"quote test');
  });

  test('quotes in the middle of a string', () => {
    const result = tokensToSearchQuery([
      { value: 'this"is' },
      { value: '"a' },
      { value: 'quote' },
    ]);
    expect(result).toEqual('this"is "a quote');
  });

  test('double spaces', () => {
    const result = tokensToSearchQuery([
      { value: 'foo' },
      { value: '' },
      { value: 'bar' },
    ]);
    expect(result).toEqual('foo  bar');
  });

  test('multiple colons', () => {
    const result = tokensToSearchQuery([
      {
        prefix: 'unit',
        value: 'http://data.oslo.kommune.no/virksomhet/osloKommune+',
      },
    ]);
    expect(result).toEqual(
      'unit:http://data.oslo.kommune.no/virksomhet/osloKommune+',
    );
  });

  test('escaped quotes', () => {
    const result = tokensToSearchQuery([
      { value: 'foo' },
      { value: 'bar"baz', quoted: true },
    ]);
    expect(result).toEqual('foo "bar\\"baz"');
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

  test.each(strings)(
    'should convert to tokens and back to string: %s',
    (str) => {
      const tokens = searchQueryToTokens(str);
      const result = tokensToSearchQuery(tokens);
      expect(result).toEqual(str);
    },
  );
});
