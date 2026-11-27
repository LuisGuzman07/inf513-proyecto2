import type { CatalogCareerOption } from './types';

export function normalizeCatalogText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesCatalogSearch(
  option: { name: string | null | undefined; sourceNames?: readonly string[] },
  search: string
) {
  const needle = normalizeCatalogText(search);
  if (!needle) return true;
  const haystack = [option.name ?? '', ...(option.sourceNames ?? [])]
    .map((text) => normalizeCatalogText(text))
    .join(' ');
  return haystack.includes(needle);
}

export function groupCatalogOptions(options: CatalogCareerOption[]) {
  const groups = new Map<string, CatalogCareerOption[]>();
  for (const option of options) {
    const key = option.faculty_name || 'Facultad sin identificar';
    const current = groups.get(key);
    if (current) current.push(option);
    else groups.set(key, [option]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
}
