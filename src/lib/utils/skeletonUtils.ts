export function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function skeletonString(min: number, max: number): string;
export function skeletonString(length: number): string;
export function skeletonString(minOrLength: number, max?: number) {
  const minLength = max !== undefined ? minOrLength : minOrLength;
  const maxLength = max !== undefined ? max : minOrLength;
  const length = rand(minLength, maxLength);

  let result = '';
  for (let i = 0; i < length; i++) {
    // Add a space randomly for line breaks (every 5-10 characters on average)
    if (i > 0 && Math.random() < 0.15) {
      result += ' ';
    } else {
      result += 'x';
    }
  }

  return result;
}
