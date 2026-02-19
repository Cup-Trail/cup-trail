/**
 * Combines two arrays into a single array for iterating. Keeps the length of the smaller list.
 * @param s Array of S
 * @param t Array of T
 * @returns Array of tuples of [T, S]
 * @example zip(arr1, arr2).forEach(([a1, a2]) => {...})
 */
export function zip<S, T>(s: S[], t: T[]): [S, T][] {
  const length = Math.min(s.length, t.length);
  return Array.from({ length }, (_, i) => [s[i], t[i]]);
}
