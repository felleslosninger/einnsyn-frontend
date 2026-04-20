export function normalizeEnhetParamValues(enhetValues: string[]): string[] {
  const normalizedValues: string[] = [];

  for (const rawValue of enhetValues) {
    const value = rawValue.trim();
    if (value.length > 0 && !normalizedValues.includes(value)) {
      normalizedValues.push(value);
    }
  }

  return normalizedValues;
}

export function parseEnhetParam(enhetParam: string): string[] {
  return normalizeEnhetParamValues(enhetParam.split(','));
}

export function serializeEnhetParam(enhetIds: string[]): string {
  return normalizeEnhetParamValues(enhetIds).join(',');
}

export function addEnhetId(enhetIds: string[], enhetId: string): string[] {
  const normalizedId = enhetId.trim();
  if (normalizedId.length === 0 || enhetIds.includes(normalizedId)) {
    return enhetIds;
  }

  return [...enhetIds, normalizedId];
}

export function removeEnhetId(enhetIds: string[], enhetId: string): string[] {
  const normalizedId = enhetId.trim();
  const nextEnhetIds = enhetIds.filter((id) => id !== normalizedId);
  return nextEnhetIds.length === enhetIds.length ? enhetIds : nextEnhetIds;
}
