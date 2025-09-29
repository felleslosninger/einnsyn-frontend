export const validate = (value: string) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
  return datePattern.test(value);
};
