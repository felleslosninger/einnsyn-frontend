export function getHeaderRootPath(
  pathname: string,
  translatedSearchPath: string,
): string {
  const [rootPath] = pathname.split('/').filter(Boolean);
  if (!rootPath) {
    return 'home';
  }

  if (
    rootPath === translatedSearchPath ||
    rootPath === encodeURIComponent(translatedSearchPath)
  ) {
    return 'search';
  }

  return rootPath;
}