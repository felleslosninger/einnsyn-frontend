export function getDateFilterValue(
  value: string,
  defaultValue: string,
): string | undefined {
  return value === '' || value === defaultValue ? undefined : value;
}
