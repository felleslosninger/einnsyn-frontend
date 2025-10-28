'use server';

// Gather stop-words
const enhetSuffixes = ['saksmappe', 'statistikk'];
const modals = ['login', 'logout', 'cart'];
const stopWords = new Set([...enhetSuffixes, ...modals]);

/**
 * Get the slug from the path
 * @param path - The path to get the slug from
 * @returns - The slug and the rest of the path
 */
export const getEnhetSlugs = (path: string) => {
  const pathParts = path.split('/').filter((part) => part.length > 0);
  const stopWordIndex = pathParts.findIndex((part) => stopWords.has(part));
  const enhetSlugs = pathParts.slice(
    0,
    stopWordIndex === -1 ? undefined : stopWordIndex,
  );
  return [
    enhetSlugs,
    stopWordIndex === -1 ? '' : pathParts.slice(stopWordIndex).join('/'),
  ];
};
