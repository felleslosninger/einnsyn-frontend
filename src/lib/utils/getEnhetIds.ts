export async function getEnhetIds(
    enhetSlug: string,
    searchParams: URLSearchParams
): Promise<string[]> {
    const enhet: string[] = [];
    if (enhetSlug) {
        enhet.push(enhetSlug);
    }
    if (searchParams.has('enhet')) {
        enhet.push(...(searchParams.getAll('enhet') ?? []));
    }
    return Array.from(new Set(enhet.filter(Boolean)));
}