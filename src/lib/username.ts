/** Matches API rule: lowercase letters, digits, underscore only */
export const USERNAME_REGEX = /^[a-z0-9_]+$/;

export function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function isValidUsername(value: string): boolean {
  return value.length >= 3 && value.length <= 30 && USERNAME_REGEX.test(value);
}
