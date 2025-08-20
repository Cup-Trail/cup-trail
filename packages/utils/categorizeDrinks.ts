export const CATEGORY_RULES: Record<string, string[]> = {
  matcha: ['matcha', 'hojicha'],
  coffee: [
    'espresso',
    'americano',
    'latte',
    'cappuccino',
    'mocha',
    'coffee',
    'cold brew',
    'macchiato',
    'cortado',
    'flat white',
    'affogato',
    'cafe au lait',
  ],
  'milk-tea': ['milk tea', 'taro', 'oolong milk', 'black milk', 'thai tea'],
  'fruit-tea': [
    'fruit',
    'berry',
    'mango',
    'peach',
    'apple',
    'grape',
    'passion',
    'lychee',
    'lemon',
    'orange',
    'yuzu',
    'melon',
  ],
};

export function suggestCategoriesByKeyword(name: string): string[] {
  if (!name) return [];
  const text = `${name}`.toLowerCase();
  const hits: string[] = [];
  for (const [slug, words] of Object.entries(CATEGORY_RULES)) {
    if (words.some(w => text.includes(w))) hits.push(slug);
  }
  return Array.from(new Set(hits));
}

/**
 * Convert a slug like "fruit-tea" to a human-friendly label: "Fruit Tea".
 */
export function slugToLabel(slug: string | null | undefined): string {
  if (!slug) return '';
  return String(slug)
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .map(s => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Map an array of slugs to their labels. Preserves order.
 */
export function slugsToLabels(
  slugs: Array<string | null | undefined>
): string[] {
  return Array.isArray(slugs) ? slugs.map(slugToLabel) : [];
}
