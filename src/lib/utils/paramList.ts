export type ParamListOptions = {
  sort?: boolean;
};

/**
 * Utilities for compact list values stored in search params/search tokens.
 *
 * Values are comma-separated, trimmed, de-duplicated, and empty entries are
 * ignored. Ordering is preserved by default, with optional sorting for filters
 * where stable URLs are more useful than user-selected order.
 */
export function normalizeParamList(
  values: readonly string[],
  { sort = false }: ParamListOptions = {},
): string[] {
  const normalizedValues: string[] = [];

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (value.length > 0 && !normalizedValues.includes(value)) {
      normalizedValues.push(value);
    }
  }

  return sort ? normalizedValues.sort() : normalizedValues;
}

export function parseParamList(
  value: string | null | undefined,
  options?: ParamListOptions,
): string[] {
  return normalizeParamList(value?.split(',') ?? [], options);
}

export function serializeParamList(
  values: readonly string[],
  options?: ParamListOptions,
): string {
  return normalizeParamList(values, options).join(',');
}

export function addParamListValue(values: string[], value: string): string[] {
  const normalizedValue = value.trim();
  if (normalizedValue.length === 0 || values.includes(normalizedValue)) {
    return values;
  }

  return [...values, normalizedValue];
}

export function removeParamListValue(
  values: string[],
  value: string,
): string[] {
  const normalizedValue = value.trim();
  const nextValues = values.filter((item) => item !== normalizedValue);
  return nextValues.length === values.length ? values : nextValues;
}
