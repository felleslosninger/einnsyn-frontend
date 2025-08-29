export type SearchToken = {
  value: string;
  quoted?: boolean;
  prefix?: string;
  locked?: boolean; // Indicates if the token can be modified or not
  sign?: '+' | '-'; // Indicates hard inclusion / exclusion
  focused?: boolean;
};

/**
 * This function takes a string with the following format:
 * `single words "word sequences" prefix:"prefixed sequences" prefix:prefixedWords`
 * and returns an array of tokens with the following format:
 * [
 *  { value: 'single' },
 *  { value: 'words' },
 *  { value: 'word sequences' },
 *  { prefix: 'prefix', value: 'prefixed sequences' },
 *  { prefix: 'prefix', value: 'prefixedWords' },
 * ]
 *
 * We create empty tokens for empty strings, so the formatted string is always the same as the input string.
 *
 * @param string Full search query
 * @returns Array of tokens
 */
export function searchQueryToTokens(
  string: string,
  caretPosition?: number,
): SearchToken[] {
  const tokens: SearchToken[] = [];

  let currentPrefix: string | undefined;
  let currentWord = '';
  let quoted = false;
  let sign: '+' | '-' | undefined;
  let focused = false;

  for (let i = 0; i < string.length; i += 1) {
    const char = string[i];

    if (caretPosition !== undefined && i === caretPosition) {
      focused = true;
    }

    // Add current word to token list when we find a space
    if (char === ' ') {
      tokens.push({
        value: currentWord,
        prefix: currentPrefix,
        quoted,
        sign,
      });
      currentPrefix = undefined;
      currentWord = '';
      quoted = false;
      sign = undefined;
      focused = false;
    }

    // Include / exclude prefix if
    // - currentWord is empty
    // - sign is not set
    // - next character is a non-space
    else if (
      currentWord === '' &&
      sign === undefined &&
      currentPrefix === undefined &&
      (char === '+' || char === '-') &&
      i + 1 < string.length &&
      string[i + 1] !== ' '
    ) {
      sign = char;
    }

    // When colon is found, currentWord is the prefix
    else if (char === ':' && currentPrefix === undefined) {
      // TODO: Validate the prefix
      currentPrefix = currentWord;
      currentWord = '';
    }

    // On opening quotes, find the next quote and treat everything in between as a quoted string
    else if (char === '"' && currentWord === '') {
      let nextQuoteIndex = -1;
      for (let j = i + 1; j < string.length; j += 1) {
        // Only accept a closing quote if
        // - not escaped
        // - followed by space or end-of-string
        if (
          string[j] === '"' &&
          string[j - 1] !== '\\' &&
          (j + 1 === string.length || string[j + 1] === ' ')
        ) {
          nextQuoteIndex = j;
          break;
        }
      }

      // Treat this as a quoted string only if there is an end quote
      if (nextQuoteIndex >= 0) {
        currentWord = string.slice(i + 1, nextQuoteIndex).replace(/\\"/g, '"');
        i = nextQuoteIndex;
        quoted = true;
      } else {
        currentWord += char;
      }
    }

    // Add characters to current word
    else {
      currentWord += char;
    }
  }

  // Add the last token
  tokens.push({
    value: currentWord,
    prefix: currentPrefix,
    quoted,
    sign,
    focused,
  });

  // Remove last token if it's empty and not quoted, and the string did not end with a space.
  const lastToken = tokens[tokens.length - 1];
  if (
    tokens.length > 1 &&
    lastToken &&
    !lastToken.prefix &&
    !lastToken.quoted &&
    lastToken.value === '' &&
    !string.endsWith(' ')
  ) {
    tokens.pop();
  }

  return tokens;
}

/**
 * Convert a list of tokens to a query string.
 * @param tokens List of tokens
 * @returns Query string
 */
export function tokensToSearchQuery(tokens: SearchToken[]): string {
  const tokenStrings: string[] = [];
  for (const token of tokens) {
    const { value, quoted = false } = token;
    let result = '';
    if (token.sign) {
      result += token.sign;
    }
    if (token.prefix) {
      result += `${token.prefix}:`;
    }
    if (quoted) {
      // Escape quotes within the value before wrapping it in quotes
      const escapedValue = value.replace(/"/g, '\\"');
      result += `"${escapedValue}"`;
    } else {
      result += value;
    }
    tokenStrings.push(result);
  }
  return tokenStrings.join(' ');
}
