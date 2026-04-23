import type { LanguageCode } from '~/lib/translation/translation';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';

export type EnhetNode = {
  currentName: string;
  enhet: TrimmedEnhet;
  score: number;
};

/** Best match score across all name languages, weighted by active language. */
function getScore(
  enhet: TrimmedEnhet,
  searchWord: string,
  currentLanguageCode: LanguageCode,
): [score: number, depth: number] {
  let score = 0;
  let depth = 1;

  if (enhet.enhetstype !== 'DUMMYENHET') {
    const weight = (code: LanguageCode) =>
      currentLanguageCode === code ? 1.0 : 0.1;
    const matches = [
      { index: enhet.navn.toLowerCase().indexOf(searchWord), weight: weight('nb') },
      {
        index: enhet.navnNynorsk?.toLowerCase().indexOf(searchWord) ?? -1,
        weight: weight('nn'),
      },
      {
        index: enhet.navnSami?.toLowerCase().indexOf(searchWord) ?? -1,
        weight: weight('se'),
      },
      {
        index: enhet.navnEngelsk?.toLowerCase().indexOf(searchWord) ?? -1,
        weight: weight('en'),
      },
    ].filter((match) => match.index >= 0);

    score = matches.reduce((best, match) => {
      const thisScore = Math.max(1, 10 - match.index / 10) * match.weight;
      return thisScore > best ? thisScore : best;
    }, 0);
  }

  if (enhet.parent && typeof enhet.parent !== 'string') {
    const [parentScore, parentDepth] = getScore(
      enhet.parent,
      searchWord,
      currentLanguageCode,
    );
    if (parentScore > 0) {
      score += parentScore * 0.2;
    }
    depth += parentDepth;
  }

  return [score, depth];
}

const depthCache = new WeakMap<TrimmedEnhet, number>();

function getDepth(enhet: TrimmedEnhet): number {
  const cached = depthCache.get(enhet);
  if (cached !== undefined) {
    return cached;
  }
  const depth =
    enhet.parent && typeof enhet.parent !== 'string'
      ? 1 + getDepth(enhet.parent)
      : 0;
  depthCache.set(enhet, depth);
  return depth;
}

function sortNodes(a: EnhetNode, b: EnhetNode) {
  if (a.score !== b.score) {
    return b.score - a.score;
  }
  const depthDiff = getDepth(a.enhet) - getDepth(b.enhet);
  if (depthDiff !== 0) {
    return depthDiff;
  }
  return a.currentName?.localeCompare(b.currentName, 'no') ?? 0;
}

export function filterEnhetList(
  allNodes: EnhetNode[],
  searchString: string,
  currentLanguageCode: LanguageCode,
): EnhetNode[] {
  if (searchString.trim().length === 0) {
    return [...allNodes].sort(sortNodes);
  }

  const searchWords = searchString
    .toLowerCase()
    .split(' ')
    .filter((word) => word.length > 0);

  return allNodes
    .map((enhetNode) => {
      let score = 0;
      for (const word of searchWords) {
        const [wordScore, depth] = getScore(
          enhetNode.enhet,
          word,
          currentLanguageCode,
        );
        if (wordScore <= 0) {
          score = 0;
          break;
        }
        score += wordScore / Math.max(1, depth);
      }

      if (enhetNode.enhet.enhetstype === 'DUMMYENHET') {
        score *= 0.5;
      }

      return { ...enhetNode, score };
    })
    .filter((enhetNode) => enhetNode.score > 0)
    .sort(sortNodes);
}
