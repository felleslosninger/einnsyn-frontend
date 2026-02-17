import {
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';

type TokenRange = {
  text: string;
  start: number;
  end: number;
  prefix: string | undefined;
};

export type ActiveEnhetFilterSegment = {
  start: number;
  end: number;
  value: string;
  canReplace: boolean;
};

const tokenPattern = /\S+/g;

function getPrefix(token: string): string | undefined {
  const separatorIndex = token.indexOf(':');
  if (separatorIndex <= 0) {
    return undefined;
  }
  return token.slice(0, separatorIndex);
}

function normalizeQuery(query: string): string {
  return query.trim().replaceAll(/\s+/g, ' ');
}

function parseTokenRanges(query: string): TokenRange[] {
  return Array.from(query.matchAll(tokenPattern)).map((match) => {
    const text = match[0];
    const start = match.index ?? 0;
    const end = start + text.length;
    return {
      text,
      start,
      end,
      prefix: getPrefix(text),
    };
  });
}

function clampCaret(query: string, caretPosition: number): number {
  if (caretPosition <= 0) {
    return 0;
  }
  if (caretPosition >= query.length) {
    return query.length;
  }
  return caretPosition;
}

function getTokenAtCaret(
  tokenRanges: TokenRange[],
  caretPosition: number,
): TokenRange | undefined {
  const containingToken = tokenRanges.find(
    (token) => caretPosition >= token.start && caretPosition <= token.end,
  );
  if (containingToken) {
    return containingToken;
  }

  // If caret is in whitespace, treat the previous token as active.
  for (let i = tokenRanges.length - 1; i >= 0; i -= 1) {
    if (tokenRanges[i].end < caretPosition) {
      return tokenRanges[i];
    }
  }

  return undefined;
}

export function enhetParamToQuery(enhetParam: string): string {
  const ids = enhetParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return ids.map((id) => `enhet:${id}`).join(' ');
}

export function getEnhetIdsFromQuery(query: string): string[] {
  const ids: string[] = [];
  for (const token of searchQueryToTokens(query)) {
    if (
      token.prefix === 'enhet' &&
      token.value.length > 0 &&
      !ids.includes(token.value)
    ) {
      ids.push(token.value);
    }
  }
  return ids;
}

export function getActiveEnhetFilterSegment(
  query: string,
  caretPosition: number,
): ActiveEnhetFilterSegment {
  const caret = clampCaret(query, caretPosition);
  const tokenRanges = parseTokenRanges(query);
  const activeToken = getTokenAtCaret(tokenRanges, caret);

  if (activeToken?.prefix !== undefined) {
    return {
      start: activeToken.start,
      end: activeToken.end,
      value: '',
      canReplace: false,
    };
  }

  let start = 0;
  let end = query.length;

  for (const token of tokenRanges) {
    if (token.prefix !== 'enhet') {
      continue;
    }
    if (token.end <= caret) {
      start = token.end;
      continue;
    }
    if (token.start >= caret) {
      end = token.start;
      break;
    }
  }

  return {
    start,
    end,
    value: query.slice(start, end).trim(),
    canReplace: true,
  };
}

export function insertEnhetToken(
  query: string,
  caretPosition: number,
  enhetId: string,
): { query: string; caretPosition: number } {
  if (getEnhetIdsFromQuery(query).includes(enhetId)) {
    return { query, caretPosition: clampCaret(query, caretPosition) };
  }

  const activeFilterSegment = getActiveEnhetFilterSegment(query, caretPosition);
  const enhetToken = `enhet:${enhetId}`;

  if (!activeFilterSegment.canReplace) {
    const trimmed = query.trim();
    const appendedQuery =
      trimmed.length > 0 ? `${trimmed} ${enhetToken}` : enhetToken;
    return {
      query: appendedQuery,
      caretPosition: appendedQuery.length,
    };
  }

  const beforeSegment = query.slice(0, activeFilterSegment.start).trimEnd();
  const afterSegment = query.slice(activeFilterSegment.end).trimStart();

  const nextQuery = [beforeSegment, enhetToken, afterSegment]
    .filter((part) => part.length > 0)
    .join(' ');

  const beforeLength = beforeSegment.length > 0 ? beforeSegment.length + 1 : 0;

  return {
    query: nextQuery,
    caretPosition: beforeLength + enhetToken.length,
  };
}

export function removeEnhetToken(query: string, enhetId: string): string {
  const nextTokens = searchQueryToTokens(query).filter(
    (token) => !(token.prefix === 'enhet' && token.value === enhetId),
  );
  if (nextTokens.length === 0) {
    return '';
  }
  return normalizeQuery(tokensToSearchQuery(nextTokens));
}
