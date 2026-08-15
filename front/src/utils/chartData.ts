export interface NameCountItem {
  name: string;
  count: number;
}

export const UNKNOWN_LABEL = "نامشخص";

export const excludeUnknown = <T extends { name: string }>(
  items: T[] | null | undefined,
  unknownLabel: string = UNKNOWN_LABEL,
): T[] => {
  if (!items) return [];
  return items.filter((item) => item.name !== unknownLabel);
};

export interface SeriesItem {
  name: string;
  data: number[];
}

export const excludeUnknownCategories = (
  categories: string[] | null | undefined,
  series: SeriesItem[] | null | undefined,
  unknownLabel: string = UNKNOWN_LABEL,
): { categories: string[]; series: SeriesItem[] } => {
  if (!categories || !series) return { categories: [], series: [] };

  const indices = categories
    .map((category, index) => ({ category, index }))
    .filter(({ category }) => category !== unknownLabel)
    .map(({ index }) => index);

  return {
    categories: indices.map((index) => categories[index]),
    series: series.map((item) => ({
      name: item.name,
      data: indices.map((index) => item.data[index] ?? 0),
    })),
  };
};