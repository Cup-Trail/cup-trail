export function makeCanonicalKey(name: string, address: string): string {
  const n = normalize(name);
  const a = normalize(address);
  return `${n}__${a}`;
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ') // punctuation -> spaces
    .replace(/\s+/g, '_')
    .trim();
}
