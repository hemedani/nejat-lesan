import type { SelectOption } from "@/components/atoms/MyAsyncMultiSelect";

/**
 * City-zone names are district numbers ("1", "2", … "22"), but they may arrive
 * as Persian or Arabic digits. Normalise them before comparing so "2" sorts
 * before "10" and "۰۲" sorts with "2".
 *
 * The API already sorts with a Persian numeric collation; this is the
 * frontend's independent guarantee, as required by the QA report.
 */
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const normalizeDigits = (value: string): string =>
  value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persian = PERSIAN_DIGITS.indexOf(digit);
    if (persian >= 0) return String(persian);
    const arabic = ARABIC_DIGITS.indexOf(digit);
    return arabic >= 0 ? String(arabic) : digit;
  });

const collator = new Intl.Collator("fa", {
  numeric: true,
  sensitivity: "base",
});

const GENERAL_OPTION_LABELS = new Set([
  "همه",
  "همه مناطق",
  "همه منطقه‌ها",
]);

/** Enough for every municipality district, including Tehran's 22. */
export const CITY_ZONE_OPTION_LIMIT = 500;

export function sortCityZoneOptions(options: SelectOption[]): SelectOption[] {
  return [...options].sort((a, b) => {
    const aGeneral = GENERAL_OPTION_LABELS.has(a.label.trim());
    const bGeneral = GENERAL_OPTION_LABELS.has(b.label.trim());
    if (aGeneral !== bGeneral) return aGeneral ? -1 : 1;

    const numeric = collator.compare(
      normalizeDigits(a.label),
      normalizeDigits(b.label),
    );
    if (numeric !== 0) return numeric;

    return a.value.localeCompare(b.value);
  });
}
