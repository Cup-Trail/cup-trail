/**
 * Combines two arrays into a single array of tuples, keeping the length of the smaller array.
 * @template S - Type of elements in the first array
 * @template T - Type of elements in the second array
 * @param s - Array of type S
 * @param t - Array of type T
 * @returns Array of tuples pairing elements from both arrays
 * @example
 * const pairs = zip(['a', 'b', 'c'], [1, 2]);
 * // [[a, 1], [b, 2]]
 */
export function zip<S, T>(s: S[], t: T[]): [S, T][] {
  const length = Math.min(s.length, t.length);
  return Array.from({ length }, (_, i) => [s[i], t[i]]);
}

/**
 * Creates a new array with the value at the specified index replaced.
 * Safe to use with React state dispatch.
 * @template T - Type of array elements
 * @param array - The source array
 * @param index - The index to update (supports negative indices)
 * @param value - The new value to insert
 * @returns A new array with the updated value
 * @throws {RangeError} If index is out of bounds
 * @example
 * const arr = [1, 2, 3];
 * updateAt(arr, 1, 99); // [1, 99, 3]
 * updateAt(arr, -1, 99); // [1, 2, 99]
 */
export function updateAt<T>(array: T[], index: number, value: T): T[] {
  if (index >= array.length || index < -array.length)
    throw new RangeError('Index out of bounds');

  const normalizedIndex = index < 0 ? array.length + index : index;
  return [
    ...array.slice(0, normalizedIndex),
    value,
    ...array.slice(normalizedIndex + 1),
  ];
}
