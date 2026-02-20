import { clsx, type ClassArray } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Renders a star rating as a string of filled and empty stars.
 * @param rating - Number of filled stars (will be clamped between 0 and max)
 * @param max - Total number of stars to render (default: 5)
 * @returns String of filled (★) and empty (☆) stars
 * @example
 * renderStars(3); // '★★★☆☆'
 * renderStars(4.7, 5); // '★★★★☆'
 * renderStars(-1, 5); // '☆☆☆☆☆'
 */
export function renderStars(rating: number, max = 5): string {
  max = max < 0 ? 5 : max;
  const r = Math.max(0, Math.min(max, Math.floor(rating)));
  return '★'.repeat(r) + '☆'.repeat(max - r);
}

/**
 * Merges Tailwind CSS classes with intelligent conflict resolution.
 * Combines clsx for conditional class handling with tailwind-merge to remove conflicting utilities.
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string with Tailwind conflicts resolved
 * @example
 * cn('px-2', 'px-4'); // 'px-4'
 * cn('text-red-500', { 'text-blue-500': true }); // 'text-blue-500'
 * cn(['m-0', condition && 'mt-4']); // 'm-0' or 'm-0 mt-4'
 */
export function cn(...inputs: ClassArray): string {
  return twMerge(clsx(inputs));
}